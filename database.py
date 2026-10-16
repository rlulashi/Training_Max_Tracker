"""Transactional SQLite storage; lossless legacy payloads plus queryable entities."""
import copy
import json
import math
import sqlite3
from contextlib import contextmanager, closing
from datetime import datetime, timezone
from pathlib import Path
from training import current_max, workout_volume

BAND_PRESETS = {item['id']: item for item in json.loads(
    (Path(__file__).resolve().parent/'web'/'band-presets.json').read_text(encoding='utf-8'))['presets']}


class Conflict(Exception):
    pass


def validate(value):
    if not isinstance(value, dict) or not isinstance(value.get('athletes'), list) or not value['athletes']:
        raise ValueError('Choose a training export containing at least one athlete.')
    data = copy.deepcopy(value)
    athlete_ids, exercise_ids = set(), set()
    def number(value):
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
    for athlete in data['athletes']:
        if not isinstance(athlete, dict) or not isinstance(athlete.get('id'), str) or not athlete['id'] or athlete['id'] in athlete_ids:
            raise ValueError('Athlete IDs must be present and unique.')
        athlete_ids.add(athlete['id'])
        if not isinstance(athlete.get('name'), str) or not athlete['name'].strip() or not isinstance(athlete.get('exercises'), list):
            raise ValueError('Each athlete needs a name and an exercise list.')
        for exercise in athlete['exercises']:
            if not isinstance(exercise, dict) or not isinstance(exercise.get('id'), str) or not exercise['id'] or exercise['id'] in exercise_ids:
                raise ValueError('Exercise IDs must be present and unique.')
            exercise_ids.add(exercise['id'])
            if not isinstance(exercise.get('name'), str) or not exercise['name'].strip():
                raise ValueError('Each exercise needs a name.')
            if 'liftGroup' in exercise and (not isinstance(exercise['liftGroup'],str) or not exercise['liftGroup'].strip()):
                raise ValueError('Exercise group must be a nonempty name.')
            if 'liftRole' in exercise and exercise['liftRole'] not in ('main','variation'):
                raise ValueError('Exercise role must be main or variation.')
            if 'deadliftStyle' in exercise and exercise['deadliftStyle'] not in ('sumo','conventional','unspecified'):
                raise ValueError('Choose Sumo or Conventional, or retain an unspecified legacy stance.')
            if not number(exercise.get('oneRepMax')) or exercise['oneRepMax'] <= 0:
                raise ValueError('Exercise 1RM must be a positive number.')
            percent = exercise.get('trainingMaxPercent', 85)
            if percent not in (85, 90):
                raise ValueError('Training max modifier must be 85 or 90.')
            base = exercise.get('trainingMaxBase', math.floor(exercise['oneRepMax'] * percent / 500 + .5) * 5)
            increases = exercise.get('increases', 0)
            adjustment = exercise.get('manualTrainingMaxAdjustment', 0)
            if not all(number(n) for n in (base, increases, adjustment)) or increases < 0 or int(increases) != increases or base + increases * 5 + adjustment <= 0:
                raise ValueError('Training max and progression values are invalid.')
            for key in ('records', 'reps', 'increaseAwards', 'arRecords', 'arReps'):
                if not isinstance(exercise.get(key, {}), dict):
                    raise ValueError(f'{key} must be an object.')
            for records in list(exercise.get('records', {}).values()) + list(exercise.get('arRecords', {}).values()):
                if not isinstance(records, list):
                    raise ValueError('Lift records must be lists.')
                for record in records:
                    if not isinstance(record, dict) or not number(record.get('weight')) or record['weight'] < 0 or not number(record.get('reps')) or record['reps'] < 0:
                        raise ValueError('Invalid lift record.')
                    if not isinstance(record.get('attempts', []), list):
                        raise ValueError('Attempts must be a list.')
                    for attempt in record.get('attempts', []):
                        if not isinstance(attempt, dict) or not number(attempt.get('weight')) or not number(attempt.get('reps')) or attempt['weight'] < 0 or attempt['reps'] < 0:
                            raise ValueError('Invalid lift attempt.')
            for key in ('workouts', 'setSessions'):
                if not isinstance(exercise.get(key, []), list):
                    raise ValueError(f'{key} must be a list.')
            for workout in exercise.get('workouts', []):
                if not isinstance(workout, dict) or not all(number(workout.get(k)) and workout[k] > 0 for k in ('weight', 'sets', 'reps')):
                    raise ValueError('Workout weight, sets and reps must be positive.')
                resistance = workout.get('accommodatingResistance')
                if resistance is not None:
                    if not isinstance(resistance, dict) or resistance.get('type') not in ('chains','bands'):
                        raise ValueError('Choose chains or bands for accommodating resistance.')
                    if not number(resistance.get('weight')) or resistance['weight'] < 0 or resistance.get('basis') not in ('per-side','total'):
                        raise ValueError('Resistance requires a nonnegative weight and a per-side or total basis.')
                    if resistance['type'] == 'chains' and resistance['weight'] == 0:
                        raise ValueError('Chains require a positive weight.')
                    if resistance['type'] == 'bands':
                        choices = {'band':('micro-mini','mini','monster-mini','light','average','strong','custom'),
                                   'setup':('single','doubled','quadded','choked','reference','other'),
                                   'direction':('down','forward','reverse')}
                        if any(resistance.get(key) not in options for key,options in choices.items()):
                            raise ValueError('Bands require a valid band, setup and direction.')
                        if 'point' in resistance and resistance['point'] not in ('top','bottom','average','reference'):
                            raise ValueError('Invalid legacy band measurement point.')
                        if not isinstance(resistance.get('notes',''), str) or len(resistance.get('notes','')) > 500:
                            raise ValueError('Band notes must be text of at most 500 characters.')
                        source = resistance.get('valueSource','manual')
                        if source not in ('manual','westside'):
                            raise ValueError('Choose Westside estimate or manual band tension.')
                        if source == 'westside':
                            preset = BAND_PRESETS.get(resistance.get('presetId'))
                            if not preset or any(resistance.get(key) != preset[key] for key in ('band','setup','point')) or resistance['direction'] != preset.get('direction','down') or resistance['basis'] != 'total' or resistance['weight'] != (preset['min']+preset['max'])/2:
                                raise ValueError('Westside estimates must match their reference setup and midpoint. Use manual for overrides.')
                if not number(workout_volume(workout)) or workout_volume(workout) < 0:
                    raise ValueError('Workout volume must be finite and nonnegative; assistance cannot exceed bar weight.')
                try:
                    datetime.strptime(workout['date'], '%Y-%m-%d')
                except (KeyError, TypeError, ValueError):
                    raise ValueError('Workout date must be a valid YYYY-MM-DD date.')
    return data


def summary(data):
    exercises = [e for a in data['athletes'] for e in a['exercises']]
    return dict(athletes=len(data['athletes']), exercises=len(exercises),
                records=sum(len(r) for e in exercises for r in e.get('records', {}).values()),
                attempts=sum(len(r.get('attempts', [])) for e in exercises for rows in e.get('records', {}).values() for r in rows),
                workouts=sum(len(e.get('workouts', [])) for e in exercises),
                setSessions=sum(len(e.get('setSessions', [])) for e in exercises))


class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS revisions (
                    id INTEGER PRIMARY KEY, created_at TEXT NOT NULL,
                    source TEXT NOT NULL, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS current_state (
                    singleton INTEGER PRIMARY KEY CHECK(singleton=1),
                    revision INTEGER NOT NULL REFERENCES revisions(id), payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS athletes (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS exercises (
                    id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL REFERENCES athletes(id),
                    name TEXT NOT NULL, current_tm REAL NOT NULL, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS workouts (
                    exercise_id TEXT NOT NULL REFERENCES exercises(id), position INTEGER NOT NULL,
                    date TEXT NOT NULL, volume REAL NOT NULL, payload TEXT NOT NULL,
                    PRIMARY KEY(exercise_id, position));
                CREATE TABLE IF NOT EXISTS lift_records (
                    exercise_id TEXT NOT NULL REFERENCES exercises(id), percentage TEXT NOT NULL,
                    position INTEGER NOT NULL, payload TEXT NOT NULL,
                    PRIMARY KEY(exercise_id, percentage, position));
                CREATE TABLE IF NOT EXISTS tm_history (
                    id INTEGER PRIMARY KEY, exercise_id TEXT NOT NULL, revision INTEGER NOT NULL REFERENCES revisions(id),
                    training_max REAL NOT NULL, created_at TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS tm_history_exercise ON tm_history(exercise_id, revision);
                PRAGMA user_version=1;
            ''')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.execute('PRAGMA foreign_keys=ON')
        try:
            with db:
                yield db
        finally:
            db.close()

    def load(self):
        with self.connect() as db:
            row = db.execute('SELECT revision,payload FROM current_state WHERE singleton=1').fetchone()
        return dict(revision=row[0], state=json.loads(row[1])) if row else dict(revision=0, state=None)

    def save(self, data, expected, source='app'):
        data = validate(data)
        encoded = json.dumps(data, allow_nan=False, separators=(',', ':'))
        stamp = datetime.now(timezone.utc).isoformat()
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT revision FROM current_state WHERE singleton=1').fetchone()
            actual = row[0] if row else 0
            if expected != actual:
                raise Conflict('Another window saved newer data. Export your unsaved changes, then reload.')
            old_maxes = dict(db.execute('SELECT id,current_tm FROM exercises'))
            revision = db.execute('INSERT INTO revisions(created_at,source,payload) VALUES(?,?,?)', (stamp, source, encoded)).lastrowid
            for table in ('workouts', 'lift_records', 'exercises', 'athletes'):
                db.execute(f'DELETE FROM {table}')
            for athlete in data['athletes']:
                db.execute('INSERT INTO athletes VALUES(?,?,?)', (athlete['id'], athlete['name'], json.dumps(athlete)))
                for e in athlete['exercises']:
                    tm = current_max(e)
                    db.execute('INSERT INTO exercises VALUES(?,?,?,?,?)', (e['id'],athlete['id'],e['name'],tm,json.dumps(e)))
                    if old_maxes.get(e['id']) != tm:
                        db.execute('INSERT INTO tm_history(exercise_id,revision,training_max,created_at) VALUES(?,?,?,?)', (e['id'],revision,tm,stamp))
                    for i,w in enumerate(e.get('workouts', [])):
                        db.execute('INSERT INTO workouts VALUES(?,?,?,?,?)', (e['id'],i,w['date'],workout_volume(w),json.dumps(w)))
                    for pct, records in e.get('records', {}).items():
                        for i,r in enumerate(records):
                            db.execute('INSERT INTO lift_records VALUES(?,?,?,?)',(e['id'],pct,i,json.dumps(r)))
            db.execute('INSERT OR REPLACE INTO current_state VALUES(1,?,?)',(revision,encoded))
        return dict(revision=revision, summary=summary(data))

    def backup(self, target):
        target = Path(target)
        target.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as source, closing(sqlite3.connect(target)) as dest:
            source.backup(dest)
