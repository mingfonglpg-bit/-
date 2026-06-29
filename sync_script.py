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
FOLDER_ID = '1NYwrqsSGwVxiD_9rcw0gLC5WM6zUmvxn'

# 列出檔案並下載
results = service.files().list(q=f"'{FOLDER_ID}' in parents", fields="files(id, name)").execute()
# 修改後的下載迴圈部分
for file in results.get('files', []):
    mime_type = file.get('mimeType', '')
    file_id = file['id']
    file_name = file['name']

    # 如果是 Google 文件、試算表等，無法直接下載
    if 'application/vnd.google-apps' in mime_type:
        print(f"跳過 Google 雲端文件 (無法直接下載): {file_name}")
        continue

    print(f"下載中: {file_name}")
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.FileIO(file_name, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        fh.close()
    except Exception as e:
        print(f"下載失敗 {file_name}: {e}")
