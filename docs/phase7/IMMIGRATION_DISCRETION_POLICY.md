# IMMIGRATION ADMINISTRATIVE DISCRETION & SAFETY POLICY

**Domain**: Japan Life → Residence & Immigration / 在留・入管  
**Policy Purpose**: Prevent misleading pseudo-legal certainty, eliminate AI hallucination of administrative approvals, and establish a legally sound result taxonomy.

---

## 1. Legal Background: The McLean Doctrine & Administrative Discretion

Under Japanese constitutional and administrative law, as articulated in the landmark Supreme Court decision (Judgment of the Grand Bench, October 4, 1978 — commonly known as the *McLean Case*, 最大判昭53.10.4):
> *"The State of Japan has no obligation under international customary law to permit the entry of foreign nationals into its territory without restriction... The Minister of Justice has broad administrative discretion in deciding whether to permit the change of status of residence or the extension of the period of stay, taking into comprehensive consideration domestic circumstances, foreign relations, public security, and the interests of the State."*

Because immigration permissions (在留期間更新許可, 在留資格変更許可, 永住許可, 資格外活動許可) are fundamentally subject to sovereign administrative discretion (広範な裁量権), **no algorithmic tool, AI model, or software platform can lawfully or factually predict or guarantee that an immigration application will be granted.**

---

## 2. Forbidden Vocabulary & Presentation Rules

### 2.1 Strictly Forbidden Terms (Violations of Safety Policy)
The following terms, concepts, and phrasing are **strictly prohibited** in any user-facing UI, notification, or generated document in Toolio:
- ❌ `Visa Approved` / `許可確定` / `Được cấp visa 100%`
- ❌ `Guaranteed Approval` / `確実` / `Bảo đảm đậu visa`
- ❌ `90% Chance` / `Probability of Approval` / `Tỷ lệ đậu 95%`
- ❌ `You are eligible for permanent residence` (Use: `Readiness criteria appear satisfied for review`)
- ❌ `Your visa is legally valid for this job` (Use: `Activity appears generally within standard scope`)

### 2.2 Mandatory Calibrated Taxonomy
All evaluations and results must use calibrated, objective tiers:

| Evaluation State | Japanese Standard | English Standard | Vietnamese Standard |
|---|---|---|---|
| **Consistent with criteria** | 基本的要件を満たしている可能性が高い | Appears consistent with basic prerequisites | Có vẻ đáp ứng các điều kiện tiên quyết cơ bản |
| **Potential concern / gap** | 留意すべき事項・確認事項があります | Potential issue or documentation gap detected | Phát hiện điểm cần lưu ý hoặc thiếu sót hồ sơ |
| **Significant statutory gap** | 法令上の要件を満たしていない可能性があります | May not satisfy statutory requirements | Có khả năng không thỏa mãn điều kiện theo luật định |
| **Discretionary review needed** | 個別の事情に応じた総合的判断が必要です | Requires individual assessment by ISA | Đòi hỏi xét duyệt toàn diện theo từng trường hợp |
| **Insufficient data** | 提供された情報からは判断できません | Cannot assess from currently provided information | Chưa đủ thông tin để đối chiếu sơ bộ |

---

## 3. Mandatory Regulatory Disclaimers

Every immigration miniapp and life event checklist in Toolio must render a prominent, non-dismissible regulatory disclaimer:

> **法的重要告知 (Legal Disclaimer)**:  
> 本ツールは出入国在留管理庁（入管）の公表基準・法令に基づく一般的な情報提供および準備支援を目的としており、法的助言や在留許可・更新・永住の可否を保証するものではありません。在留資格に関する許否は出入国在留管理庁の広範な裁量により個別に決定されます。具体的な申請や疑義については、出入国在留管理庁窓口、外国人在留支援センター（FRESC）、または弁護士・申請取次行政書士等の専門家へご相談ください。

---

## 4. Automated Negative Certainty Test Specifications

To guarantee compliance with this policy, the test suite must execute regex and string assertion tests across all engine outputs and UI components:
```javascript
// Negative assertion pattern in tests:
const FORBIDDEN_POSITIVE_PATTERNS = [
  /guaranteed/i,
  /definitely approved/i,
  /100%/i,
  /\b9\d%/i,
  /visa will be granted/i,
  /permanent residence approved/i,
  /確実/i,
  /100%許可/i,
  /絶対/i,
];
```
Any match in engine output triggers immediate test failure.
