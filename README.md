README.md
# Training Max Tracker

A Python-based strength training application designed to track
exercise performance, calculate training percentages, and
automatically manage training max progression.

## Features

- Store multiple exercises with individual 1RM values
- Calculate training max (85% of 1RM)
- Generate training percentages from 40% to 120%
- Track personal best repetitions at each percentage
- Store exercise records using SQLite
- Preserve historical training cycles
- Automatically increase TM after 8+ reps at 100%

## Example

Squat:
- 1RM: 740 lbs
- Initial TM: 630 lbs
- 77.5%: 490 lbs x 6
- 80%: 505 lbs x 10

Progression:
630 lbs x 8 at 100% TM triggers a new cycle.

New TM: 640 lbs

## Technologies

- Python
- SQLite
- Git / GitHub

## Running the Application

Run:

python3 training_tracker.py

## Development Roadmap

- [x] Initial training percentage calculator
- [x] SQLite exercise database
- [x] Rep tracking
- [x] Training cycle progression
- [ ] Graphical user interface
- [ ] Performance analytics
- [ ] Mobile application