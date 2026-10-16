# Training Max Tracker

A local strength-training app for powerlifting, built with a browser interface, Python and SQLite. No third-party runtime packages are required.

## Run

Requires Python 3.10 or newer and a modern browser.

```bash
python3 server.py --no-browser
```

Open **http://127.0.0.1:4176/**. Keep the terminal open while using the app. On Windows, double-click `start-training.cmd` or run `python server.py`.

On first launch, choose **Preview empty database** or **Preview demo data**, review its contents, and confirm the import. Demo data contains **two fictional athletes, 18 exercise records and 144 workouts**. It demonstrates lift variations, different deadlift stances, chains, bands, volume history and separate Weight/AR bests. It is generated from scratch in `demo_data.py`; `samples/demo-data.json` is its portable example export. No real athlete records are included.

## Features

- Fixed horizontal Squat, Bench Press, Deadlift and Overhead Press navigation, with variation menus and additional custom groups.
- Independent records for every variation and Conventional/Sumo deadlift stance.
- Athlete and coach organizational views, dark mode and responsive layout.
- 85%/90% training max, percentage tables, rep attempts and independent Weight/AR bests.
- Workout dates, sets/reps, edit/delete, and matching workout contributions to Best Reps.
- Manual chain and band resistance, with added AR volume stacked in gold and reverse assistance shown separately.
- Day/week/month/year volume charts.
- Independent lb/kg choices for max setup, table, workouts, chart and plate calculator.
- Specialty-bar plate loading and pound/kilogram conversion.
- SQLite saves, conflict protection, JSON exports, database backups and save history.

The percentage/Best Reps table and Workout History start collapsed. The workout-entry form stays visible. Add/edit exercises through the Add exercise dialog.

## Training rules

Percentages use current training max and retain the app's five-pound rounding. Changing display units does not change rounding or training rules. Progression remains a manually applied +5 lb increase after a qualifying recorded performance under the estimated-max rule. AR bests are separate and do not trigger regular progression.

Workout volume is bar weight × sets × reps, plus manually entered chain/band resistance; reverse assistance subtracts from logged load. These are bookkeeping estimates, not measurements of force throughout a lift. Band tension is manual-only. Existing internal reference presets are retained solely for compatibility with older imported records.

## Data and privacy

Your database is created locally at `data/training.sqlite3`. Databases, backups, exports, logs and recovered data are excluded by `.gitignore`. The repository includes fictional JSON examples only. Never force-add a personal database or export.

Use **Export data** for portable JSON and **Database backup** for a consistent SQLite copy. Stop the app and preserve a copy of the existing data folder before restoring a database backup. Canonical weights in SQLite/JSON are pounds; unit selections are independent display/input preferences. Original IDs, history and unknown legacy fields are preserved on import.

The server binds only to 127.0.0.1. Coach/athlete views are organizational views, not authenticated accounts. Internet hosting requires authentication, authorization, HTTPS and a production deployment configuration.

## Development

```bash
python3 -m unittest discover -s tests -v
node tests/test_frontend.cjs
```

Node.js 18+ is needed only for interface-logic tests. Tests use temporary databases and fictional fixtures; they do not require personal training data. Live browser/visual checks remain a separate manual check.

`web/` contains the interface and lift catalog. `server.py` serves local assets and JSON routes, `database.py` manages validation/transactions/history, and `training.py` handles progression and volume calculations. State writes use revision checks to avoid silently overwriting another window.

If upgrading the original command-line repository, the installation helper preserves its former `training_tracker.py` under `legacy/`. Git history is retained; no force push is needed.
