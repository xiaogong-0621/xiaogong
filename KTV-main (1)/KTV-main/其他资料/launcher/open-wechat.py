import subprocess
import os
import sys

cli_path = os.path.join(os.environ['ProgramFiles(x86)'], 'Tencent', '微信web开发者工具', 'cli.bat')
proj_path = r'e:\syyktv\KTV-main (1)\KTV-main\小程序'

print(f'CLI path exists: {os.path.exists(cli_path)}', flush=True)
print(f'Project path exists: {os.path.exists(proj_path)}', flush=True)

# cmd /c expects the entire command as one string argument
cmd = f'cmd /c ""{cli_path}" open --project "{proj_path}""'
print(f'Running: {cmd}', flush=True)
result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
print('STDOUT:', result.stdout, flush=True)
print('STDERR:', result.stderr, flush=True)
print('Return code:', result.returncode, flush=True)
