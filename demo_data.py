"""Entirely fictional, deterministic demonstration data. No real athlete records."""
from datetime import date, timedelta


def demo_state():
    athletes=[]
    for athlete_index in range(2):
        prefix=f'demo-{athlete_index+1}'
        exercises=[]
        definitions=[
            ('Squat','squat','main',None,500),
            ('Box Squat','squat','variation',None,450),
            ('Bench Press','bench','main',None,350),
            ('Floor Press','bench','variation',None,315),
            ('Deadlift','deadlift','main','conventional',550),
            ('Deadlift','deadlift','main','sumo',525),
            ('Rack Pull','deadlift','variation','conventional',600),
            ('Overhead Press','overhead','main',None,225),
            ('Log','overhead','variation',None,200),
        ]
        for index,(name,group,role,stance,max_value) in enumerate(definitions):
            identifier=f'{prefix}-lift-{index+1}'
            one_rm=max_value-athlete_index*25
            tm=int(one_rm*.85/5+.5)*5
            workouts=[]
            for session in range(8):
                weight=int((tm*(.65+session*.025))/5+.5)*5
                workouts.append(dict(id=f'{identifier}-workout-{session+1}',date=(date(2026,1,5)+timedelta(days=session*3)).isoformat(),
                    weight=weight,percent=round(weight/tm*100,1),sets=3,reps=5 if session<5 else 3,
                    savedAt=f'2026-01-{5+session*3:02d}T12:00:00Z',accommodatingResistance=None))
            # Demonstrate separate AR history, a gold chain volume segment and reverse assistance.
            workouts[-3]['accommodatingResistance']=dict(type='chains',weight=40,basis='per-side')
            workouts[-2]['accommodatingResistance']=dict(type='bands',band='micro-mini',setup='single',direction='down',weight=30,basis='total',notes='Fictional demo setup',valueSource='manual')
            workouts[-1]['accommodatingResistance']=dict(type='bands',band='mini',setup='single',direction='reverse',weight=25,basis='total',notes='Fictional demo assistance',valueSource='manual')
            e=dict(id=identifier,name=name,oneRepMax=one_rm,trainingMaxPercent=85,trainingMaxBase=tm,
                manualTrainingMaxAdjustment=0,increases=0,reps={'100':5},
                records={'100':[dict(weight=tm,reps=5,awardedForReps=0,savedAt='2026-01-01T12:00:00Z',attempts=[dict(weight=tm,reps=5,savedAt='2026-01-01T12:00:00Z')])]},
                arRecords={},arReps={},increaseAwards={},setSessions=[],workouts=workouts,
                liftGroup=group,liftGroupLabel={'squat':'Squat','bench':'Bench Press','deadlift':'Deadlift','overhead':'Overhead Press'}[group],liftRole=role)
            if stance:e['deadliftStyle']=stance
            exercises.append(e)
        athletes.append(dict(id=prefix,name=f'Demo Athlete {"A" if athlete_index==0 else "B"}',exercises=exercises))
    return dict(demo=True,demoNotice='All athletes and training histories in this file are fictional.',
        athletes=athletes,view='athlete',selectedAthleteId='demo-1',selectedId='demo-1-lift-1',
        darkMode=False,volumePeriod='week',bestRepsMode='weight',deadliftStyle='conventional',activeLiftGroup='squat',
        units=dict(max='lb',table='lb',workout='lb',volume='lb',loader='lb'))
