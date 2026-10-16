/* Exercise organization is a view over stable records; no history is merged. */
window.LiftCatalog = (() => {
  const groups = [
    {key:'squat', name:'Squat', variations:['Box Squat','Front Squat','Hatfield Squat']},
    {key:'bench', name:'Bench Press', variations:['Incline Press','Floor Press','Close Grip Bench','Decline Press','Illegal Wide Grip Bench','Reverse Grip Bench','Pin Press']},
    {key:'deadlift', name:'Deadlift', variations:['Rack Pull','Block Pull','Deficit Deadlift','Frame Deadlift','Trap/Hex Bar Deadlift','Wagon Wheel Deadlift','Tire Deadlift']},
    {key:'overhead', name:'Overhead Press', variations:['Log','Axle','Standing Overhead Press','Seated Overhead Press','Pin Press']},
  ];
  const normalize = name => String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function infer(name) {
    const n=normalize(name);
    // Pin Press alone is ambiguous: retain it under Other until explicitly assigned.
    if (/squat|\bssb\b/.test(n)) return 'squat';
    if (/deadlift|dead lift|rack pull|block pull|trap.*bar|hex.*bar/.test(n)) return 'deadlift';
    if (/overhead|\bohp\b|\blog\b|\baxle\b/.test(n)) return 'overhead';
    if (/bench|floor press|incline press|decline press/.test(n)) return 'bench';
    return 'other';
  }
  function describe(exercise) {
    const key=exercise.liftGroup || infer(exercise.name);
    const catalog=groups.find(g=>g.key===key);
    const n=normalize(exercise.name);
    const mainNames={squat:['squat','back squat'],bench:['bench','bench press'],deadlift:['deadlift','deadlift sumo','sumo deadlift','deadlift conventional','conventional deadlift'],overhead:['overhead press','ohp']};
    const role=exercise.liftRole || ((mainNames[key] || [normalize(exercise.liftGroupLabel)]).includes(n) ? 'main' : 'variation');
    const style=key==='deadlift' ? exercise.deadliftStyle === 'unspecified' ? null : exercise.deadliftStyle || (/\bsumo\b/.test(n)?'sumo':/\bconventional\b/.test(n)?'conventional':null) : null;
    return {key,name:catalog?.name || exercise.liftGroupLabel || 'Other exercises',role,style};
  }
  function sameName(a,b) { return normalize(a)===normalize(b); }
  return {groups, normalize, infer, describe, sameName};
})();
