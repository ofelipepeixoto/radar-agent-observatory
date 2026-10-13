"""Local synthetic browser regression; no provider or external console connection."""
import json, os, pathlib, subprocess, time
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
root = pathlib.Path(__file__).resolve().parents[1]
artifacts = root / 'artifacts'
artifacts.mkdir(exist_ok=True)
fixture = json.loads((root/'fixtures/synthetic.json').read_text())
checks = []; blocked = []; errors = []
base_url=os.environ.get('OBSERVATORY_TEST_URL','http://127.0.0.1:8787/')
origin=urlsplit(base_url)
assert origin.hostname in ('127.0.0.1','localhost'), 'tests accept loopback only'
server = None if 'OBSERVATORY_TEST_URL' in os.environ else subprocess.Popen(['node','src/server.mjs'], cwd=root, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
try:
    if server: assert '127.0.0.1:8787' in server.stdout.readline(), 'local server did not start'
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':1280,'height':900}, service_workers='block')
        def guard(route):
            if route.request.url.startswith(base_url):
                route.continue_()
            else:
                blocked.append(route.request.url.split('?')[0]); route.abort()
        context.route('**/*',guard)
        page=context.new_page(); page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base_url)
        def wait_done(): expect(page.locator('#load')).to_be_enabled()
        page.locator('#load').click(); wait_done()
        assert page.locator('#records button').count()==3
        assert page.locator('#mode').inner_text()=='SIMULAÇÃO EXPLÍCITA'
        assert 'Nenhuma execução' in page.locator('#state').inner_text()
        checks.append('synthetic mode and three explicit outcomes')
        page.get_by_role('button',name='Resultado desconhecido · recibo-ficticio-003').click()
        assert 'Não presumir falha' in page.locator('#summary').inner_text()
        checks.append('unknown is not success or failure')
        page.locator('#records button').first.click(); page.locator('#relations summary').click()
        assert page.locator('svg text').count()==2
        checks.append('optional declared relations, with textual equivalent')
        page.screenshot(path=str(artifacts/'desktop.png'),full_page=True)
        page.locator('#source').select_option('historical'); page.locator('#load').click(); wait_done()
        assert 'Desatualizado' in page.locator('#freshness').inner_text()
        assert page.locator('#mode').inner_text()=='HISTÓRICO DECLARADO'
        checks.append('stale historical observation')
        page.locator('#source').select_option('empty'); page.locator('#load').click(); wait_done()
        assert page.locator('#empty').is_visible()
        assert page.locator('#records button').count()==0
        assert not page.locator('#detail').is_visible()
        checks.append('empty is not fabricated success')
        page.locator('#source').select_option('invalid');page.locator('#load').click();wait_done()
        assert 'INVALID_CONTRACT' in page.locator('#error').inner_text()
        checks.append('selectable invalid synthetic fixture shows error')
        page.screenshot(path=str(artifacts/'error.png'),full_page=True)
        hostile=json.loads(json.dumps(fixture))
        payload='<img src=x onerror="window.auditExecuted=1">'
        hostile['sourceLabel']=payload
        hostile['records'][0]['summary']=payload
        hostile['records'][0]['evidence'][0]['document']=payload
        page.route('**/fixtures/synthetic.json',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(hostile)))
        page.locator('#source').select_option('synthetic');page.locator('#load').click();wait_done()
        assert payload in page.locator('#origin').inner_text()
        assert payload == page.locator('#summary').inner_text()
        assert payload in page.locator('#evidence').inner_text()
        assert page.locator('img').count()==0 and page.evaluate('window.auditExecuted || 0')==0
        checks.append('three DOM paths: origin, summary, evidence remain literal text')
        page.unroute('**/fixtures/synthetic.json')
        for status in [401,429,500]:
            page.route('**/fixtures/synthetic.json',lambda r,request,s=status:r.fulfill(status=s,content_type='application/json',body='{"error":"synthetic"}'))
            page.locator('#load').click();wait_done()
            assert f'HTTP_{status}' in page.locator('#error').inner_text()
            assert not page.locator('#snapshot').is_visible()
            checks.append(f'HTTP {status} hides previous data and shows error')
            page.unroute('**/fixtures/synthetic.json')
        page.route('**/fixtures/synthetic.json',lambda r:r.fulfill(status=200,content_type='application/json',body='{"schemaVersion":1,"mode":"live"}'))
        page.locator('#load').click();wait_done()
        assert 'INVALID_CONTRACT' in page.locator('#error').inner_text()
        checks.append('invalid contract never renders as live telemetry')
        page.unroute('**/fixtures/synthetic.json')
        page.locator('#load').click();wait_done()
        assert not page.locator('#error').is_visible()
        checks.append('explicit retry recovers after errors')
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.locator('#load').focus();page.keyboard.press('Enter');wait_done()
        assert page.locator('#records button').count()==3
        checks.append('390px reflow and keyboard load')
        assert page.evaluate('localStorage.length')==0 and page.evaluate('sessionStorage.length')==0
        checks.append('no browser storage written')
        page.screenshot(path=str(artifacts/'mobile.png'),full_page=True)
        assert not errors and not blocked
        result={'browser':browser.version,'checks':checks,'count':len(checks),'pageErrors':errors,'externalRequests':blocked,'limits':'synthetic local fixtures; no real backend, LLM, screen reader or production auth tested'}
        (artifacts/'browser-results.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
        print(json.dumps(result,indent=2,ensure_ascii=False))
        browser.close()
finally:
    if server: server.terminate();server.wait(timeout=5)
