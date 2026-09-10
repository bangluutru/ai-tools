# Japan Life V1: Certified End-to-End Life Journeys

- **Date**: 2026-09-11
- **Status**: 100% Certified & Verified (Checkpoint C7)
- **Scenarios Covered**: 7 Canonical Real-World Journeys (Journeys A through G)
- **Automated Harness**: `packages/core/tests/navigator-golden-journeys.test.js` (8/8 PASS)
- **Browser Execution**: Verified in Google Chrome via `puppeteer-core`

---

## 1. Summary of Certified Scenarios

```mermaid
journey
    title 7 Canonical Life Journeys in Toolio Japan Life V1
    section Journey A: Start Life
      Airport landing & card issue: 5: User
      14-day Municipal registration: 5: User
      Shakai Hoken / Nenkin enrollment: 5: User
      Bank, SIM & Basic tax setup: 4: User
    section Journey B: Change Job
      Request Gensen Choshuhyo: 5: User
      14-day ISA immigration notice: 5: User
      Bridge health insurance (Kokumin/Nin'i): 5: User
      Join new company & year-end tax: 5: User
    section Journey C: Lose Job
      Receive Rishokuhyo from employer: 5: User
      Hello Work 90-day benefit claim: 5: User
      Switch to Kokumin Kenko Hoken: 5: User
      Apply for National Pension exemption: 5: User
    section Journey D: Newborn Baby
      Lump-Sum Birth Grant (500k JPY): 5: User
      Maternity & Childcare Benefits: 5: User
      Child Allowance (Jidou Teate): 5: User
      Juminhyo & My Number for infant: 5: User
    section Journey E: Relocation
      Tenshutsu notification in origin city: 5: User
      Tennyu notification within 14 days: 5: User
      Update My Number address chip: 5: User
      Transfer child & insurance files: 5: User
    section Journey F: Family Joining
      File Dependent COE at ISA: 5: User
      Airport arrival & dependent card: 5: User
      Municipal residence registration: 5: User
      Add spouse/child to Kenpo Fuyou: 5: User
    section Journey G: Leave Japan
      Tenshutsu (Moving abroad): 5: User
      Appoint Tax Representative (NTA): 5: User
      Surrender card / Special re-entry check: 5: User
      Claim Dattai Ichijikin (Pension): 5: User
```

---

## 2. Certified Journey Specifications & Assertions

### Journey A — Start Life in Japan (Employee Arrival)
- **User Story**: A newly arriving Vietnamese engineer lands at Narita/Haneda, begins work, and settles in Tokyo.
- **Entry Mode**: Situation-first ("Tôi mới sang Nhật") or Navigator category `starting-life`.
- **Stages Verified**:
  1. `airport-arrival`: Landing permission stamp, Residence Card issued on the spot.
  2. `municipal-setup`: 14-day Juminhyo address registration, My Number application.
  3. `insurance-pension-enrollment`: Company Shakai Hoken enrollment (Kenpo + Kousei Nenkin).
  4. `daily-essentials-settling`: Bank account (Yucho), SIM card, basic income tax withholding awareness.
- **Assertions**: No crash, 0 broken capabilities, correct priority ordering.

### Journey B — Change Job (Job Change with a 2-Week Gap)
- **User Story**: An IT specialist resigns from Company A, takes 2 weeks off, and joins Company B.
- **Entry Mode**: Situation-first ("Tôi vừa đổi công ty") or Navigator category `changing-job`.
- **Stages Verified**:
  1. `before-leaving`: Obtains Gensen Choshuhyo, Rishokuhyo, and checks resident tax balance.
  2. `between-jobs-gap`:
     - **Mandatory 14-day notification** to ISA (`REASON_JOB_CHANGE_VISA_NOTIFY`).
     - Temporary enrollment in Kokumin Kenko Hoken or Nin'i Keizoku (`REASON_KENPO_SWITCH`).
     - Temporary National Pension Category 1 (`REASON_NENKIN_SWITCH`).
  3. `before-new-job-starts`: Confirms work scope matches visa category (`work-scope-checker-jp`).
  4. `after-starting-new-job`: Enrolls in new company insurance, submits Gensen Choshuhyo for Nenmatsu Chousei.
- **Assertions**: Visa notification correctly flagged as **URGENT (14-day statutory deadline)**; Kokumin Kenpo transition recommended.

### Journey C — Lose Job (Unemployment / Involuntary Separation)
- **User Story**: A worker is laid off, receives Rishokuhyo-1 and 2, and seeks statutory income support.
- **Entry Mode**: Situation-first ("Tôi nghỉ việc chưa có việc mới") or Tool-first `unemployment-eligibility-jp`.
- **Stages Verified**:
  1. `eligibility-check`: Verified 6 months (involuntary) or 12 months (general) insured duration.
  2. `benefit-simulation`: Calculates statutory daily benefit (60-80% wage) and total days (90 to 240 days).
  3. `health-pension-bridge`: Advises local city hall reduction for involuntary job loss (Tokutei Jukyushikakusha).
- **Assertions**: Calculation basis accurately references MHLW August revision tables.

### Journey D — Newborn Child (Maternity, Childcare & Allowance)
- **User Story**: A couple living in Shinagawa gives birth to their first child.
- **Entry Mode**: Situation-first ("Vợ tôi sắp sinh con") or Tool-first `birth-wizard-jp`.
- **Stages Verified**:
  1. `birth-grant`: 500,000 JPY direct payment to hospital (Shussan Ikuji Ichijikin).
  2. `maternity-allowance`: 2/3 of standard daily remuneration for 98 statutory days.
  3. `childcare-benefit`: 67% wage for initial 180 days, 50% thereafter.
  4. `child-allowance`: 15,000 JPY/month under 3 yrs; 15-day application rule.
- **Assertions**: Shinagawa municipality grant rules correctly resolved with fallback awareness.

### Journey E — Inter-City Relocation (Shinjuku to Fukuoka)
- **User Story**: A resident moves from Shinjuku-ku (Tokyo) to Fukuoka-shi.
- **Entry Mode**: Situation-first ("Tôi chuyển nhà từ Tokyo sang Fukuoka") or Tool-first `moving-wizard-jp`.
- **Stages Verified**:
  1. `moving-out`: Tenshutsu-todoke filed up to 14 days before move, Tenshutsu Shomeisho issued.
  2. `moving-in`: Tennyu-todoke filed at Fukuoka ward office within 14 days of arrival.
  3. `mynumber-update`: Digital address chip updated within 14 days (or expires in 90 days).
- **Assertions**: Distance calculation (> 500km) appropriately adjusts estimated relocation budgets.

### Journey F — Family Joining (Spouse / Child COE)
- **User Story**: An engineer brings spouse and child from Vietnam under Dependent (`家族滞在`) status.
- **Entry Mode**: Situation-first ("Vợ con tôi sắp sang Nhật") or Tool-first `family-immigration-guide-jp`.
- **Stages Verified**:
  1. `coe-filing`: Income proof, tax certificate, relationship documents (Khai sinh, Đăng ký kết hôn).
  2. `landing`: Landing inspection and issuance of Dependent Residence Card at port of entry.
  3. `municipal-fuyou`: Added to resident record, enrolled in company health insurance as Fuyou.
- **Assertions**: Discretionary disclaimer prominently displayed; 1.3M income ceiling explained.

### Journey G — Leaving Japan Permanently (Departure & Pension Refund)
- **User Story**: A foreign professional resigns and returns to Vietnam permanently.
- **Entry Mode**: Situation-first ("Tôi sắp về nước hẳn") or Tool-first `leaving-japan-wizard-jp`.
- **Stages Verified**:
  1. `tenshutsu-abroad`: Moving-out abroad filing at municipal office.
  2. `tax-representative`: Appoints Nozei Kanrinin at Tax Office for resident tax and 20.42% refund.
  3. `pension-withdrawal`: Files Dattai Ichijikin within 2 years to claim lump-sum pension refund.
- **Assertions**: 20.42% withholding tax refund route clearly documented without dead ends.

---

## 3. End-to-End System Invariants

1. **Zero Browser Crash**: All 7 journeys execute cleanly with zero uncaught exceptions in console.
2. **Deterministic Routes**: All recommended action buttons link to valid routes (`#/tools/...`).
3. **Context Preservation**: Changing routes or refreshing does not corrupt active form state.
4. **Data Minimization**: Zero sensitive PII leaked into URLs, analytics, or persistent storage.
