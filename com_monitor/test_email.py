import smtplib
from email.mime.text import MIMEText
import sys

def test_email():
    try:
        msg = MIMEText('This is a test email from the new Communication Monitor App.')
        msg['Subject'] = 'Test Alert: ComMonitor'
        msg['From'] = 'bigmap@bigmap.ai'
        msg['To'] = 'sarangnet@gmail.com'

        with smtplib.SMTP_SSL('mail.privateemail.com', 465) as server:
            server.login('bigmap@bigmap.ai', 'Bm20127202!')
            server.send_message(msg)
        print("Success")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == '__main__':
    test_email()
