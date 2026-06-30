import os
import io
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# 1. 設定權限與服務初始化
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
creds_info = json.loads(os.environ['GDRIVE_JSON'])
creds = service_account.Credentials.from_service_account_info(creds_info, scopes=SCOPES)
service = build('drive', 'v3', credentials=creds)

# 2. 設定參數
FOLDER_ID = '1NYwrqsSGwVxiD_9rcw0gLC5WM6zUmvxn'
# 設定你要同步的檔案列表
TARGET_FILES = ['frozen.csv', 'chilled.csv', 'beef.csv']

def sync_files():
    for target_name in TARGET_FILES:
        print(f"--- 正在檢查: {target_name} ---")
        
        # 搜尋特定名稱的檔案，依修改時間排序，只取最新的 1 個
        results = service.files().list(
            q=f"'{FOLDER_ID}' in parents and name = '{target_name}'",
            fields="files(id, name, mimeType, modifiedTime)",
            orderBy="modifiedTime desc",
            pageSize=1
        ).execute()

        files = results.get('files', [])

        if not files:
            print(f"找不到檔案: {target_name}")
            continue

        file = files[0]
        file_id = file['id']
        file_name = file['name']
        mime_type = file.get('mimeType', '')

        print(f"找到最新版本: {file_name} (ID: {file_id})")

        try:
            # 判斷是否為 Google 試算表，若不是則依一般檔案處理
            if mime_type == 'application/vnd.google-apps.spreadsheet':
                print(f"正在匯出 {file_name} 為 CSV...")
                request = service.files().export_media(fileId=file_id, mimeType='text/csv')
            else:
                print(f"正在下載 {file_name}...")
                request = service.files().get_media(fileId=file_id)

            # 寫入檔案
            fh = io.FileIO(target_name, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            fh.close()
            print(f"成功同步: {target_name}")

        except Exception as e:
            print(f"同步 {target_name} 時發生錯誤: {e}")

if __name__ == '__main__':
    sync_files)
