"""Test the exact allowlisted dist at a nested route with no server-side code."""
import functools,http.server,os,pathlib,shutil,subprocess,tempfile,threading
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='observatory-static-') as folder:
    shutil.copytree(root/'dist',pathlib.Path(folder)/'nested'/'demo')
    handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=folder)
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        result=subprocess.run(['python3','scripts/browser_test.py'],cwd=root,env={**os.environ,'OBSERVATORY_TEST_URL':f'http://127.0.0.1:{server.server_port}/nested/demo/'})
        assert result.returncode==0
    finally:server.shutdown();server.server_close();thread.join()
