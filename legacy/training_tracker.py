import sqlite3
from datetime import datetime

DB_NAME = "training_tracker.db"

PERCENTAGES = [
    40, 45, 50, 55, 60, 65, 70, 72.5, 75, 77.5, 80, 82.5,
    85, 87.5, 90, 92.5, 95, 97.5, 100, 101, 103, 105,
    107.5, 110, 112.5, 115, 117.5, 120
]

DEFAULT_TM_INCREASES = {
    "Squat": 10,
    "Deadlift": 10,
    "Bench": 5,
    "Press": 5
}


def round_to_nearest_5(value: float) -> int:
    """Round to nearest 5 pounds."""
    return int(round(value / 5.0) * 5)


def get_connection():
    return sqlite3.connect(DB_NAME)


def initialize_database():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            one_rm REAL NOT NULL,
            tm_increment REAL NOT NULL DEFAULT 5
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS cycles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_id INTEGER NOT NULL,
            cycle_number INTEGER NOT NULL,
            training_max REAL NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id),
            UNIQUE(exercise_id, cycle_number)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS percentages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            value REAL NOT NULL UNIQUE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rep_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_id INTEGER NOT NULL,
            cycle_id INTEGER NOT NULL,
            percentage_id INTEGER NOT NULL,
            weight REAL NOT NULL,
            reps INTEGER NOT NULL,
            logged_at TEXT NOT NULL,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id),
            FOREIGN KEY (cycle_id) REFERENCES cycles(id),
            FOREIGN KEY (percentage_id) REFERENCES percentages(id)
        )
    """)

    for pct in PERCENTAGES:
        cur.execute(
            "INSERT OR IGNORE INTO percentages (value) VALUES (?)",
            (pct,)
        )

    conn.commit()
    conn.close()


def get_default_increment(exercise_name: str) -> int:
    return DEFAULT_TM_INCREASES.get(exercise_name, 5)


def add_exercise(name: str, one_rm: float, tm_increment: float | None = None):
    """
    Add an exercise if missing.
    Creates cycle 1 automatically with TM = 85% of 1RM rounded to nearest 5.
    """
    if tm_increment is None:
        tm_increment = get_default_increment(name)

    initial_tm = round_to_nearest_5(one_rm * 0.85)

    conn = get_connection()
    cur = conn.cursor()

    # Insert or update exercise
    cur.execute("""
        INSERT INTO exercises (name, one_rm, tm_increment)
        VALUES (?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            one_rm = excluded.one_rm,
            tm_increment = excluded.tm_increment
    """, (name, one_rm, tm_increment))

    # Get exercise id
    cur.execute("SELECT id FROM exercises WHERE name = ?", (name,))
    exercise_id = cur.fetchone()[0]

    # Only create cycle 1 if no cycles exist
    cur.execute("SELECT COUNT(*) FROM cycles WHERE exercise_id = ?", (exercise_id,))
    cycle_count = cur.fetchone()[0]

    if cycle_count == 0:
        cur.execute("""
            INSERT INTO cycles (exercise_id, cycle_number, training_max, is_active, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (exercise_id, 1, initial_tm, 1, datetime.now().isoformat()))

    conn.commit()
    conn.close()


def get_exercise_id(name: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM exercises WHERE name = ?", (name,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def get_active_cycle(exercise_name: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT e.id, c.id, c.cycle_number, c.training_max, e.one_rm, e.tm_increment
        FROM exercises e
        JOIN cycles c ON e.id = c.exercise_id
        WHERE e.name = ? AND c.is_active = 1
        ORDER BY c.cycle_number DESC
        LIMIT 1
    """, (exercise_name,))

    row = cur.fetchone()
    conn.close()
    return row


def get_percentage_id(percentage: float):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM percentages WHERE value = ?", (percentage,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def log_reps(exercise_name: str, percentage: float, reps: int):
    """
    Log reps for an exercise at a percentage in the active cycle.
    If 100% is hit for 8+ reps, create the next cycle and increase TM.
    """
    active = get_active_cycle(exercise_name)
    if not active:
        raise ValueError(f"Exercise '{exercise_name}' not found or has no active cycle.")

    exercise_id, cycle_id, cycle_number, training_max, one_rm, tm_increment = active

    percentage_id = get_percentage_id(percentage)
    if percentage_id is None:
        raise ValueError(f"Percentage {percentage} was not found.")

    weight = round_to_nearest_5(training_max * (percentage / 100.0))

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO rep_logs (exercise_id, cycle_id, percentage_id, weight, reps, logged_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (exercise_id, cycle_id, percentage_id, weight, reps, datetime.now().isoformat()))

    # Progression rule: if 100% TM is performed for 8 or more reps
    if percentage == 100 and reps >= 8:
        new_tm = training_max + tm_increment

        # close old cycle
        cur.execute("""
            UPDATE cycles
            SET is_active = 0
            WHERE id = ?
        """, (cycle_id,))

        # create new cycle
        cur.execute("""
            INSERT INTO cycles (exercise_id, cycle_number, training_max, is_active, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (exercise_id, cycle_number + 1, new_tm, 1, datetime.now().isoformat()))

        print(f"\nProgression triggered for {exercise_name}.")
        print(f"Old TM: {training_max}")
        print(f"New TM: {new_tm}")
        print(f"New active cycle: {cycle_number + 1}\n")

    conn.commit()
    conn.close()


def get_best_reps(exercise_id: int, cycle_id: int, percentage: float):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT MAX(rl.reps)
        FROM rep_logs rl
        JOIN percentages p ON rl.percentage_id = p.id
        WHERE rl.exercise_id = ? AND rl.cycle_id = ? AND p.value = ?
    """, (exercise_id, cycle_id, percentage))

    row = cur.fetchone()
    conn.close()
    return row[0] if row and row[0] is not None else ""


def get_chart(exercise_name: str):
    active = get_active_cycle(exercise_name)
    if not active:
        raise ValueError(f"Exercise '{exercise_name}' not found.")

    exercise_id, cycle_id, cycle_number, training_max, one_rm, tm_increment = active

    rows = []
    for pct in PERCENTAGES:
        weight = round_to_nearest_5(training_max * (pct / 100.0))
        best_reps = get_best_reps(exercise_id, cycle_id, pct)
        rows.append((pct, weight, best_reps))

    return {
        "exercise_name": exercise_name,
        "one_rm": one_rm,
        "cycle_number": cycle_number,
        "training_max": training_max,
        "rows": rows
    }


def print_chart(exercise_name: str):
    chart = get_chart(exercise_name)

    print("=" * 50)
    print(f"Exercise: {chart['exercise_name']}")
    print(f"1RM: {chart['one_rm']}")
    print(f"Cycle: {chart['cycle_number']}")
    print(f"Training Max (TM): {chart['training_max']}")
    print("=" * 50)
    print(f"{'%':>8} | {'Weight':>8} | {'Best Reps':>10}")
    print("-" * 34)

    for pct, weight, best_reps in chart["rows"]:
        pct_label = f"{pct}%"
        print(f"{pct_label:>8} | {weight:>8} | {str(best_reps):>10}")

    print()


def print_all_cycles(exercise_name: str):
    """
    Show all cycle history for an exercise.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT e.id
        FROM exercises e
        WHERE e.name = ?
    """, (exercise_name,))
    exercise = cur.fetchone()

    if not exercise:
        conn.close()
        print(f"No exercise found for {exercise_name}")
        return

    exercise_id = exercise[0]

    cur.execute("""
        SELECT cycle_number, training_max, is_active, created_at
        FROM cycles
        WHERE exercise_id = ?
        ORDER BY cycle_number
    """, (exercise_id,))
    rows = cur.fetchall()

    conn.close()

    print(f"\nCycle history for {exercise_name}")
    print("-" * 50)
    for cycle_number, training_max, is_active, created_at in rows:
        status = "ACTIVE" if is_active == 1 else "CLOSED"
        print(f"Cycle {cycle_number}: TM {training_max} | {status} | Created {created_at}")
    print()


def seed_example_data():
    """
    Creates your squat example and logs the first cycle numbers you showed.
    """
    add_exercise("Squat", 740, 10)

    # First cycle squat TM should be 630
    # Using the example values you gave:
    log_reps("Squat", 77.5, 6)
    log_reps("Squat", 80, 10)


def main():
    initialize_database()

    print("Training Tracker")
    print("1. Seed squat example")
    print("2. Show squat chart")
    print("3. Log squat 100% x 8 to trigger next cycle")
    print("4. Show squat cycle history")
    print("5. Add a new exercise")
    print("6. Log reps for an exercise")
    print("7. Show chart for an exercise")
    print("0. Exit")

    while True:
        choice = input("\nChoose an option: ").strip()

        if choice == "1":
            seed_example_data()
            print("\nSquat example data added.\n")

        elif choice == "2":
            try:
                print_chart("Squat")
            except ValueError as e:
                print(e)

        elif choice == "3":
            try:
                log_reps("Squat", 100, 8)
            except ValueError as e:
                print(e)

        elif choice == "4":
            print_all_cycles("Squat")

        elif choice == "5":
            name = input("Exercise name: ").strip()
            one_rm = float(input("1RM: ").strip())
            increment_input = input("TM increase for next cycle (blank for default): ").strip()

            tm_increment = float(increment_input) if increment_input else None
            add_exercise(name, one_rm, tm_increment)
            print(f"\nExercise '{name}' added or updated.\n")

        elif choice == "6":
            name = input("Exercise name: ").strip()
            percentage = float(input("Percentage: ").strip())
            reps = int(input("Reps: ").strip())

            try:
                log_reps(name, percentage, reps)
                print("\nReps logged.\n")
            except ValueError as e:
                print(e)

        elif choice == "7":
            name = input("Exercise name: ").strip()
            try:
                print_chart(name)
            except ValueError as e:
                print(e)

        elif choice == "0":
            print("Goodbye.")
            break

        else:
            print("Invalid choice. Try again.")


if __name__ == "__main__":
    main()