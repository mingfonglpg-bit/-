import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# 設定權限與檔案 ID
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
# 讀取 GitHub Secrets 設定的 JSON 內容 (透過環境變數傳入)
creds = service_account.Credentials.from_service_account_info(
    eval(os.environ['GDRIVE_JSON']), scopes=SCOPES)
service = build('drive', 'v3', credentials=creds)

# 這裡填入你的資料夾 ID
FOLDER_ID = '你的資料夾ID'

# 列出檔案並下載
results = service.files().list(q=f"'{FOLDER_ID}' in parents", fields="files(id, name)").execute()
for file in results.get('files', []):
    print(f"下載中: {file['name']}")
    request = service.files().get_media(fileId=file['id'])
    fh = io.FileIO(file['name'], 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
