import copy
import json
import sqlite3
import sys
import tempfile
import io
from types import SimpleNamespace
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from database import Store, Conflict, validate, summary, BAND_PRESETS
from training import current_max, nearest_five, progress, workout_volume
from server import make_handler, ROOT
from demo_data import demo_state

SCRATCH=ROOT/'tests'/'scratch'
SCRATCH.mkdir(exist_ok=True)


def sample():
    return {'athletes':[{'id':'athlete-a','name':'Athlete A','exercises':[
        {'id':'squat','name':'Squat','oneRepMax':300,'trainingMaxPercent':85,
         'trainingMaxBase':255,'increases':0,'manualTrainingMaxAdjustment':0,
         'records':{'100':[{'weight':255,'reps':8,'eligibleForReps':8,'awardedForReps':0,
                            'attempts':[{'weight':255,'reps':8,'savedAt':'2026-10-16T10:00:00Z'}]}]},
         'workouts':[{'id':'w','date':'2026-10-16','weight':200,'sets':3,'reps':5}],
         'setSessions':[{'weight':100,'repsBySet':[3,4]}], 'futureField':{'keep':True}}
    ]}], 'darkMode':True, 'volumePeriod':'week'}


class DatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=SCRATCH)
        self.store=Store(Path(self.temp.name)/'test.sqlite3')
    def tearDown(self): self.temp.cleanup()

    def test_lossless_demo_and_restart(self):
        data=demo_state()
        result=self.store.save(data,0,'legacy-import')
        self.assertEqual(result['summary']['athletes'],2)
        self.assertEqual(result['summary']['exercises'],18)
        self.assertEqual(result['summary']['records'],18)
        self.assertEqual(Store(self.store.path).load()['state'],data)

    def test_atomic_conflict_and_revision_history(self):
        data=sample(); self.store.save(data,0)
        newer=copy.deepcopy(data); newer['athletes'][0]['name']='Renamed'
        self.store.save(newer,1)
        with self.assertRaises(Conflict): self.store.save(data,1)
        self.assertEqual(self.store.load()['state'],newer)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM revisions').fetchone()[0],2)
            self.assertEqual(json.loads(db.execute('SELECT payload FROM revisions WHERE id=1').fetchone()[0]),data)

    def test_deletion_does_not_restore_seed(self):
        data=sample(); self.store.save(data,0)
        data['athletes'][0]['exercises']=[]; self.store.save(data,1)
        self.assertEqual(Store(self.store.path).load()['state']['athletes'][0]['exercises'],[])

    def test_validation_keeps_database_unchanged(self):
        data=sample(); self.store.save(data,0)
        bad=copy.deepcopy(data); bad['athletes'][0]['exercises'][0]['oneRepMax']=float('nan')
        with self.assertRaises(ValueError): self.store.save(bad,1)
        bad=copy.deepcopy(data); bad['athletes'][0]['exercises'][0]['workouts'][0]['sets']=-1
        with self.assertRaises(ValueError): self.store.save(bad,1)
        self.assertEqual(self.store.load()['state'],data)

    def test_progression_consumed_once_and_backup(self):
        data=sample(); e=data['athletes'][0]['exercises'][0]
        self.store.save(data,0)
        self.assertEqual(current_max(e),255)
        progress(e); self.assertEqual(current_max(e),260)
        with self.assertRaises(ValueError): progress(e)
        self.store.save(data,1)
        backup=Path(self.temp.name)/'backup.sqlite3'; self.store.backup(backup)
        self.assertEqual(Store(backup).load(),self.store.load())
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT volume FROM workouts').fetchone()[0],3000)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM tm_history').fetchone()[0],2)
            self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(),[])

    def test_rounding_and_independent_one_rm(self):
        self.assertEqual(nearest_five(312.5),315)
        e=sample()['athletes'][0]['exercises'][0]
        e['oneRepMax']=400
        self.assertEqual(current_max(e),255)

    def test_chains_round_trip_volume_and_edit(self):
        data=sample(); workout=data['athletes'][0]['exercises'][0]['workouts'][0]
        workout.update(weight=630,sets=1,reps=1,accommodatingResistance={'type':'chains','weight':80,'basis':'per-side'})
        self.assertEqual(workout_volume(workout),790)
        self.store.save(data,0)
        self.assertEqual(Store(self.store.path).load()['state'],data)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT volume FROM workouts').fetchone()[0],790)
        workout['accommodatingResistance']['basis']='total'
        workout.update(sets=3,reps=2)
        self.store.save(data,1)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT volume FROM workouts').fetchone()[0],4260)
        workout['accommodatingResistance']=None
        self.store.save(data,2)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT volume FROM workouts').fetchone()[0],3780)

    def test_invalid_chains_cannot_replace_saved_data(self):
        original=sample(); self.store.save(original,0)
        for resistance in ({'type':'chains','weight':-80,'basis':'per-side'},
                           {'type':'chains','weight':80,'basis':'unknown'},
                           {'type':'chains','weight':True,'basis':'total'},
                           {'type':'chains','weight':float('nan'),'basis':'total'},
                           {'type':'bands','weight':80,'basis':'total'}):
            with self.subTest(resistance=resistance):
                data=copy.deepcopy(original)
                data['athletes'][0]['exercises'][0]['workouts'][0]['accommodatingResistance']=resistance
                with self.assertRaises(ValueError): self.store.save(data,1)
                self.assertEqual(self.store.load()['state'],original)

    def test_bands_directions_setup_and_persistence(self):
        data=sample(); workout=data['athletes'][0]['exercises'][0]['workouts'][0]
        workout.update(weight=630,sets=3,reps=2,accommodatingResistance={
            'type':'bands','weight':100,'basis':'total','band':'light','setup':'doubled',
            'direction':'down','point':'top','notes':'Demo anchor setup'})
        r=workout['accommodatingResistance']
        self.assertEqual(workout_volume(workout),4380)
        self.store.save(data,0)
        self.assertEqual(Store(self.store.path).load()['state'],data)
        r['setup']='quadded'; r['direction']='forward'
        self.assertEqual(workout_volume(workout),4380)  # tension is already for the entire setup
        r['direction']='reverse'
        self.assertEqual(workout_volume(workout),3180)
        r['basis']='per-side'; r['point']='bottom'
        self.store.save(data,1)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT volume FROM workouts').fetchone()[0],2580)
        self.assertEqual(self.store.load()['state'],data)
        r['weight']=315  # 630 lb total assistance gives a zero logged load
        self.assertEqual(workout_volume(workout),0)
        self.store.save(data,2)
        r['weight']=316
        with self.assertRaises(ValueError): self.store.save(data,3)
        self.assertEqual(self.store.load()['revision'],3)
        r['weight']=0; r['setup']='invalid'
        with self.assertRaises(ValueError): validate(data)

    def test_westside_defaults_and_manual_overrides(self):
        for preset in BAND_PRESETS.values():
            with self.subTest(preset=preset['id']):
                data=sample(); workout=data['athletes'][0]['exercises'][0]['workouts'][0]
                workout['accommodatingResistance']={
                    'type':'bands','weight':(preset['min']+preset['max'])/2,
                    'basis':'total','band':preset['band'],'setup':preset['setup'],
                    'direction':preset.get('direction','down'),'point':preset['point'], 'valueSource':'westside','presetId':preset['id']}
                validate(data)
                workout['accommodatingResistance']['direction']='down' if preset.get('direction') == 'reverse' else 'reverse'
                with self.assertRaises(ValueError): validate(data)
        data=sample(); workout=data['athletes'][0]['exercises'][0]['workouts'][0]
        r={'type':'bands','weight':145,'basis':'total','band':'light','setup':'choked',
           'direction':'down','point':'reference','valueSource':'westside','presetId':'light-squat'}
        workout['accommodatingResistance']=r
        self.store.save(data,0)
        self.assertEqual(Store(self.store.path).load()['state'],data)
        r['weight']=137.5
        with self.assertRaises(ValueError): self.store.save(data,1)
        r['valueSource']='manual'
        self.store.save(data,1)
        self.assertEqual(self.store.load()['state'],data)

    def test_lightened_method_bottom_estimates(self):
        for band,weight in [('mini',55),('monster',110),('light',200)]:
            with self.subTest(band=band):
                preset=BAND_PRESETS[f'reverse-{band}-squat']
                data=sample(); workout=data['athletes'][0]['exercises'][0]['workouts'][0]
                workout.update(weight=750,sets=1,reps=1,accommodatingResistance={
                    'type':'bands','band':preset['band'],'setup':'single','direction':'reverse',
                    'point':'bottom','weight':weight,'basis':'total','valueSource':'westside','presetId':preset['id']})
                validate(data)
                self.assertEqual(workout_volume(workout),750-weight)
                workout['accommodatingResistance']['point']='top'
                with self.assertRaises(ValueError): validate(data)
                workout['accommodatingResistance'].update(valueSource='manual',weight=0)
                validate(data)
                self.assertEqual(workout_volume(workout),750)

    def test_manual_micro_mini_without_removed_fields(self):
        data=sample(); workout=data['athletes'][0]['exercises'][0]['workouts'][0]
        workout['accommodatingResistance']={
            'type':'bands','band':'micro-mini','setup':'single','direction':'down',
            'weight':35,'basis':'total','valueSource':'manual','notes':''}
        self.store.save(data,0)
        self.assertEqual(Store(self.store.path).load()['state'],data)
        self.assertEqual(workout_volume(workout),3525)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT volume FROM workouts').fetchone()[0],3525)

    def test_separate_ar_bests_round_trip_and_validation(self):
        data=sample(); data['bestRepsMode']='ar'
        exercise=data['athletes'][0]['exercises'][0]
        exercise['arReps']={'100':12}
        exercise['arRecords']={'100':[{'weight':255,'reps':12,'attempts':[{'weight':255,'reps':12}]}]}
        self.store.save(data,0)
        self.assertEqual(Store(self.store.path).load()['state'],data)
        self.assertEqual(exercise['records']['100'][0]['reps'],8)
        # AR records cannot make the raw training policy award additional increases.
        exercise['records']={}
        with self.assertRaises(ValueError): progress(exercise)
        bad=copy.deepcopy(data)
        bad['athletes'][0]['exercises'][0]['arRecords']['100'][0]['reps']=-1
        with self.assertRaises(ValueError): self.store.save(bad,1)
        self.assertEqual(self.store.load()['revision'],1)

    def test_grouped_lifts_same_names_and_stances_round_trip(self):
        data=sample(); exercises=data['athletes'][0]['exercises']
        for identifier,group,style in [('conventional','deadlift','conventional'),('sumo','deadlift','sumo'),('bench-pin','bench',None),('overhead-pin','overhead',None)]:
            exercise=copy.deepcopy(exercises[0])
            exercise.update(id=identifier,name='Deadlift' if group=='deadlift' else 'Pin Press',liftGroup=group,liftRole='main' if group=='deadlift' else 'variation')
            if style: exercise['deadliftStyle']=style
            exercises.append(exercise)
        self.store.save(data,0)
        self.assertEqual(Store(self.store.path).load()['state'],data)
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM exercises').fetchone()[0],5)
        bad=copy.deepcopy(data);bad['athletes'][0]['exercises'][1]['deadliftStyle']='invalid'
        with self.assertRaises(ValueError):self.store.save(bad,1)

    def test_unit_preferences_preserve_canonical_weight_and_volume(self):
        data=sample(); data['units']={'max':'kg','table':'lb','workout':'kg','volume':'kg','loader':'lb'}
        exercise=data['athletes'][0]['exercises'][0]
        exercise['oneRepMax']=400/0.45359237
        workout=exercise['workouts'][0]
        workout.update(weight=125/0.45359237,sets=2,reps=3,accommodatingResistance={'type':'chains','weight':20/0.45359237,'basis':'per-side'})
        self.store.save(data,0)
        loaded=Store(self.store.path).load()['state']
        self.assertEqual(loaded,data)
        self.assertAlmostEqual(loaded['athletes'][0]['exercises'][0]['oneRepMax']*0.45359237,400)
        with self.store.connect() as db:
            self.assertAlmostEqual(db.execute('SELECT volume FROM workouts').fetchone()[0]*0.45359237,990)


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=SCRATCH); self.store=Store(Path(self.temp.name)/'http.sqlite3')
        self.handler=make_handler(self.store,Path(self.temp.name)/'backups')
        self.server=SimpleNamespace(server_port=4174)
        self.token=self.call('/api/state')[1]['token']
    def tearDown(self): self.temp.cleanup()
    def call(self,path,body=None,headers=None):
        payload=b'' if body is None else json.dumps(body).encode()
        headers={'Host':'127.0.0.1:4174','Content-Type':'application/json',
                 'Content-Length':str(len(payload)),'X-Training-Token':getattr(self,'token',''),**(headers or {})}
        head=f'{"GET" if body is None else "POST"} {path} HTTP/1.0\r\n'
        request=(head+''.join(f'{key}: {value}\r\n' for key,value in headers.items())+'\r\n').encode()+payload
        class Connection:
            def __init__(self): self.output=b''
            def makefile(self,*args): return io.BytesIO(request)
            def sendall(self,data): self.output+=bytes(data)
        connection=Connection()
        self.handler(connection,('127.0.0.1',12345),self.server)
        response_head,raw=connection.output.split(b'\r\n\r\n',1)
        code=int(response_head.split(b' ')[1])
        return code,json.loads(raw) if b'Content-Type: application/json' in response_head else raw
    def test_http_save_export_progress_and_conflict(self):
        self.assertEqual(self.call('/api/preview',{'state':sample()})[0],200)
        self.assertEqual(self.store.load()['revision'],0)
        self.assertEqual(self.call('/api/state',{'revision':0,'state':sample()})[0],200)
        code,result=self.call('/api/progress',{'revision':1,'exerciseId':'squat'})
        self.assertEqual(code,200); self.assertEqual(result['state']['athletes'][0]['exercises'][0]['increases'],1)
        self.assertEqual(self.call('/api/progress',{'revision':1,'exerciseId':'squat'})[0],409)
        self.assertEqual(self.call('/api/progress',{'revision':2,'exerciseId':'squat'})[0],400)
        self.assertEqual(self.call('/api/export')[1],self.store.load()['state'])
        code,backup=self.call('/api/backup'); self.assertEqual(code,200); self.assertTrue(backup.startswith(b'SQLite format 3'))
    def test_demo_preview_does_not_seed_database(self):
        code,state=self.call('/api/demo')
        self.assertEqual(code,200)
        self.assertEqual(len(state['athletes']),2)
        self.assertTrue(state['demo'])
        self.assertEqual(self.store.load()['revision'],0)
        self.assertEqual(self.call('/api/recovery')[0],404)

    def test_private_files_and_cross_site_requests_blocked(self):
        self.assertEqual(self.call('/lifts.js')[0],200)
        for path in ('/data/training.sqlite3','/server.py','/../server.py','/migration/recovered-training-data.json'):
            self.assertEqual(self.call(path)[0],404)
        body={'revision':0,'state':sample()}
        self.assertEqual(self.call('/api/state',body,{'Origin':'https://example.com'})[0],403)
        self.assertEqual(self.call('/api/state',body,{'X-Training-Token':'wrong'})[0],403)
        self.assertEqual(self.call('/api/state',headers={'Host':'evil.example'})[0],403)
        self.assertEqual(self.store.load()['revision'],0)


if __name__ == '__main__': unittest.main()
