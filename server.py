"""Local-only application server. No third-party dependencies."""
import argparse
import json
import secrets
import threading
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from database import Store, Conflict, validate, summary
from training import progress
from demo_data import demo_state

ROOT = Path(__file__).resolve().parent
MAX_BODY = 16 * 1024 * 1024


def make_handler(store, backup_dir):
    token = secrets.token_urlsafe(32)
    class Handler(BaseHTTPRequestHandler):
        def respond(self, code, value, content_type='application/json; charset=utf-8', attachment=None):
            body = value if isinstance(value, bytes) else json.dumps(value, allow_nan=False).encode()
            self.send_response(code)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
            if attachment:
                self.send_header('Content-Disposition', f'attachment; filename="{attachment}"')
            self.end_headers()
            self.wfile.write(body)

        def allowed(self, write=False):
            origin = f'http://127.0.0.1:{self.server.server_port}'
            if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
                self.respond(403, {'error':'Open the app using its 127.0.0.1 address.'})
                return False
            if self.headers.get('Sec-Fetch-Site') == 'cross-site' or self.headers.get('Origin') not in (None, origin):
                self.respond(403, {'error':'Cross-site access is blocked.'})
                return False
            if write and self.headers.get('X-Training-Token') != token:
                self.respond(403, {'error':'Reload the app before saving.'})
                return False
            return True

        def do_GET(self):
            if not self.allowed(): return
            path = urlsplit(self.path).path
            if path == '/api/state':
                self.respond(200, dict(store.load(), token=token))
            elif path == '/api/export':
                current = store.load()
                self.respond(200, current['state'], attachment='training-data.json')
            elif path == '/api/demo':
                self.respond(200, demo_state())
            elif path == '/api/backup':
                name = 'training-' + datetime.now().strftime('%Y%m%d-%H%M%S-') + secrets.token_hex(3) + '.sqlite3'
                target = Path(backup_dir)/name
                store.backup(target)
                self.respond(200, target.read_bytes(), 'application/vnd.sqlite3', name)
            else:
                files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js', '/storage.js':'storage.js', '/styles.css':'styles.css', '/band-presets.json':'band-presets.json', '/lifts.js':'lifts.js'}
                filename = files.get(path)
                if not filename:
                    self.respond(404, {'error':'Not found'})
                    return
                types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'}
                self.respond(200, (ROOT/'web'/filename).read_bytes(), types[Path(filename).suffix])

        def do_POST(self):
            if not self.allowed(write=True): return
            path = urlsplit(self.path).path
            if path not in ('/api/state','/api/preview','/api/progress'):
                self.respond(404, {'error':'Not found'})
                return
            try:
                size = int(self.headers.get('Content-Length',0))
                if size <= 0 or size > MAX_BODY:
                    self.respond(413, {'error':'Choose an export smaller than 16 MB.'})
                    return
                if self.headers.get('Content-Type','').split(';')[0] != 'application/json':
                    self.respond(415, {'error':'JSON required.'})
                    return
                body = json.loads(self.rfile.read(size), parse_constant=lambda x: (_ for _ in ()).throw(ValueError('Non-finite number')))
                if not isinstance(body, dict): raise ValueError('Invalid request.')
                if path == '/api/preview':
                    self.respond(200, summary(validate(body.get('state'))))
                elif path == '/api/progress':
                    current = store.load()
                    if type(body.get('revision')) is not int or body['revision'] != current['revision']:
                        raise Conflict('Another window saved newer data. Export your unsaved changes, then reload.')
                    if current['state'] is None: raise ValueError('Import training data first.')
                    exercise = next((e for a in current['state']['athletes'] for e in a['exercises'] if e['id'] == body.get('exerciseId')), None)
                    if exercise is None: raise ValueError('Exercise not found.')
                    progress(exercise)
                    result = store.save(current['state'], current['revision'], 'progression')
                    self.respond(200, dict(result, state=current['state']))
                else:
                    revision = body.get('revision')
                    if type(revision) is not int or revision < 0: raise ValueError('Invalid revision.')
                    self.respond(200, store.save(body.get('state'), revision))
            except Conflict as exc:
                self.respond(409, {'error':str(exc)})
            except (ValueError, TypeError, KeyError, OverflowError) as exc:
                self.respond(400, {'error':str(exc)})
            except Exception:
                self.log_error('Database save failed')
                self.respond(500, {'error':'Save failed. Keep this window open and export your changes.'})
    return Handler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4176)
    parser.add_argument('--database', type=Path, default=ROOT/'data'/'training.sqlite3')
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    store = Store(args.database)
    backups = args.database.parent/'backups'
    if store.load()['revision']:
        store.backup(backups/('startup-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.sqlite3'))
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(store,backups))
    server.daemon_threads = True
    url = f'http://127.0.0.1:{args.port}/'
    print(f'Training Max Tracker: {url}\nKeep this window open. Press Ctrl+C to stop.', flush=True)
    if not args.no_browser:
        threading.Timer(.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
