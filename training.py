"""Existing local-app training policy, shared by backend validation/actions."""
import math
from datetime import datetime, timezone


def nearest_five(value):
    # Match JavaScript Math.round, including halfway values.
    return math.floor(value / 5 + .5) * 5


def current_max(exercise):
    base = exercise.get('trainingMaxBase', nearest_five(exercise['oneRepMax'] * exercise.get('trainingMaxPercent',85) / 100))
    return base + exercise.get('increases',0) * 5 + exercise.get('manualTrainingMaxAdjustment',0)


def workout_volume(workout):
    resistance = workout.get('accommodatingResistance')
    extra = resistance['weight'] * (2 if resistance['basis'] == 'per-side' else 1) if resistance else 0
    if resistance and resistance['type'] == 'bands' and resistance['direction'] == 'reverse':
        extra = -extra
    return (workout['weight'] + extra) * workout['sets'] * workout['reps']


def progress(exercise):
    """Award exactly one +5 increase for an eligible unconsumed local-app record."""
    pending = []
    tm = current_max(exercise)
    for percentage, records in exercise.get('records', {}).items():
        if float(percentage) < 85:
            continue
        for record in records:
            reps = record.get('reps',0)
            if reps <= 0 or reps >= 37:
                continue
            estimate = 36 * record['weight'] / (37-reps)
            if record.get('eligibleForReps',0) > record.get('awardedForReps',0) and estimate > tm:
                pending.append((estimate,record))
    if not pending:
        raise ValueError('No eligible lift is ready for training-max progression.')
    record = max(pending, key=lambda item:item[0])[1]
    exercise['increases'] = exercise.get('increases',0) + 1
    record['awardedForReps'] = max(record.get('awardedForReps',0),record.get('eligibleForReps',0))
    record['progressedAt'] = datetime.now(timezone.utc).isoformat()
    return exercise
