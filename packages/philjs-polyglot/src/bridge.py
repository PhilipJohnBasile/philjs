import sys
import json
import traceback

def handle_command(cmd):
    try:
        if cmd['type'] == 'exec':
            exec(cmd['code'], globals())
            return {'status': 'ok'}
        elif cmd['type'] == 'eval':
            result = eval(cmd['code'], globals())
            return {'status': 'ok', 'result': result}
        elif cmd['type'] == 'call':
            func = globals().get(cmd['fn'])
            if not func:
                raise ValueError(f"Function {cmd['fn']} not found")
            result = func(*cmd['args'])
            return {'status': 'ok', 'result': result}
        else:
            return {'status': 'error', 'error': 'Unknown command'}
    except Exception as e:
        return {'status': 'error', 'error': str(e), 'traceback': traceback.format_exc()}

def main():
    for line in sys.stdin:
        if not line: break
        try:
            cmd = json.loads(line)
            response = handle_command(cmd)
            response['id'] = cmd.get('id')
            print(json.dumps(response), flush=True)
        except json.JSONDecodeError:
            print(json.dumps({'status': 'error', 'error': 'Invalid JSON'}), flush=True)

if __name__ == "__main__":
    main()
