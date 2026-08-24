# 🛡️ GitHub Account & Repository Safety Guide

คู่มือแนวทางปฏิบัติที่ดีที่สุด (Best Practices) ในการดูแลรักษาโปรเจกต์และบัญชี GitHub ให้ปลอดภัย ป้องกันการถูกระงับบัญชี (Account Suspension / Flagging) และป้องกันความปลอดภัยของโค้ด 100%

---

## ⚠️ 1. สาเหตุหลักที่ทำให้บัญชี GitHub ถูกแบนหรือระงับ

1. **การทำ API Keys / Tokens / Passwords หลุด (Secret Leakage):**
   - GitHub มีระบบตรวจจับ Secret Scanning อัตโนมัติ หากตรวจพบ AWS Keys, OpenAI Key, Database Connection String หรือ JWT Secret หลุดไปใน Public Repository ระบบอาจจำกัดสิทธิ์หรือระงับบัญชีเพื่อความปลอดภัย
2. **การอัปโหลดไฟล์ขนาดใหญ่เกินเกณฑ์ (Large File Abuse):**
   - การเผลอเอา `node_modules/` (ที่มีไฟล์เป็นหมื่นๆ ไฟล์) หรือไฟล์ Binary `.exe`, `.zip`, `.mp4` ขนาดใหญ่ (>100MB) ขึ้น Git
3. **พฤติกรรมคล้ายบอท / สแปมคอมมิต (Spamming Commits):**
   - การรันสคริปต์ยิง Commit ถี่ๆ เพื่อปั่นเขียว (Contribution Graph Farming) หรือสร้าง Repository เปล่าๆ จำนวนมากในเวลาสั้นๆ
4. **โค้ดที่เข้าข่ายละเมิดกฎการใช้งาน (ToS Violation):**
   - สคริปต์สแปมเว็บ, บอทปั่นวิว, โค้ดโจมตี (DDoS/Phishing), หรือโค้ดที่มีลิขสิทธิ์หลุดออกมา

---

## ✅ 2. กฎเหล็กในการรักษาความปลอดภัยโปรเจกต์นี้

### กฎข้อที่ 1: ห้าม Commit ไฟล์ `.env` โดยเด็ดขาด
- ให้เก็บตัวแปร Environment ไว้อย่างปลอดภัยในเครื่องตนเอง
- ใช้ไฟล์ `.env.example` เป็น Template สาธารณะ เพื่อบอกว่าโปรเจกต์ต้องการตัวแปรใดบ้าง (โดยไม่มีรหัสผ่านจริง)

### กฎข้อที่ 2: ตั้งค่า `.gitignore` ให้รัดกุมเสมอ
- ตรวจสอบให้แน่ใจว่าโฟลเดอร์ต่อไปนี้อยู่ใน `.gitignore`:
  ```
  node_modules/
  dist/
  build/
  .env
  .env.*
  *.db
  *.sqlite
  *.log
  ```

### กฎข้อที่ 3: ใช้ Conventional Commits ที่มีความหมาย
- เขียนข้อความ Commit สื่อถึงฟีเจอร์จริงอย่างเป็นมืออาชีพ เช่น:
  - `feat:` เพิ่มฟีเจอร์ใหม่
  - `fix:` แก้ไขบั๊ก
  - `refactor:` ปรับปรุงโครงสร้างโค้ด
  - `docs:` แก้ไขเอกสาร
  - `chore:` จัดการ Dependency หรือ Config

### กฎข้อที่ 4: ตรวจสอบ `git status` ก่อน `git push` ทุกครั้ง
- รันคำสั่ง `git status` เสมอ เพื่อดูว่ามีไฟล์แปลกปลอมหรือไฟล์ Secret ติดเข้ามาใน Staging Area หรือไม่

---

## 🚀 3. แนะนำการใช้งานร่วมกับ GitHub Actions (CI/CD)
- หากใช้ CI/CD ให้เก็บค่า Secret ในแท็บ **Settings > Secrets and variables > Actions** ของ GitHub Repository เสมอ ห้ามฮาร์ดโค้ดลงในไฟล์ workflow YAML
