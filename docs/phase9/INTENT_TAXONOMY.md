# JAPAN LIFE INTENT TAXONOMY & DISAMBIGUATION RULES (PHASE 9)
**Package**: `@ai-tools/core`  
**Namespace**: `packages/core/src/navigator/intent/`  
**Date**: 2026-09-11  
**Status**: COMPLETE TAXONOMY

---

## 1. Intent Model Design
In Toolio Japan Life Navigator, an **Intent** captures what the user wants to accomplish in plain language and normalizes it into a canonical machine-readable token.

### Taxonomy Structure:
```
intent.jp.<domain_or_category>.<action>
```

---

## 2. Canonical Intent Registry & Multilingual Aliases

| Canonical Intent ID | Target Life Event / Capability | Aliases (VI) | Aliases (JA) | Aliases (EN) | Romanized Aliases |
|---|---|---|---|---|---|
| `intent.jp.starting_life` | `life.jp.starting-life` | Mới sang Nhật, mới đến Nhật, sang Nhật lần đầu, nhập cảnh Nhật, làm thủ tục mới sang | 来日, 入国, 日本生活スタート, 新規入国, 転入 | Arrive in Japan, newcomer, starting life, landing, settle in Japan | rainichi, nyuukoku, seikatsu start |
| `intent.jp.job.change` | `life.jp.changing-job` | Chuyển việc, đổi việc, đổi công ty, nhảy việc, sang công ty mới | 転職, 会社変更, 転職手続き, 会社を辞めて次へ | Change job, job transition, switch employer, new job | tenshoku, kaisha henkou |
| `intent.jp.job.leave` | `life.jp.leaving-job` | Nghỉ việc, thôi việc, thất nghiệp, mất việc, xin rishokuhyo | 退職, 離職, 仕事を辞める, 失業, ハローワーク, 会社辞めた | Leave job, quit job, unemployed, resignation, hello work | taishoku, rishoku, shitsugyou |
| `intent.jp.move` | `life.jp.moving` | Chuyển nhà, đổi chỗ ở, chuyển trọ, tenshutsu, tennyu | 引越し, 転居, 転出, 転入, 引っ越し, 住所変更 | Move house, relocation, change address, moving out, moving in | hikkoshi, tenkyo, tenshutsu, tennyuu |
| `intent.jp.birth` | `life.jp.pregnancy-birth` | Sinh con, mang thai, có bầu, đẻ con, trợ cấp sinh con, trợ cấp thai sản, chăm con | 出産, 妊娠, 育児, 出産一時金, 出産手当金, 産休, 育休 | Have a baby, birth, pregnancy, maternity allowance, childcare leave | shussan, ninshin, ikuji, sankyuu, ikukyuu |
| `intent.jp.family.invite` | `life.jp.family-joining` | Bảo lãnh vợ, bảo lãnh chồng, bảo lãnh con, đón gia đình sang Nhật, xin COE | 家族呼び寄せ, 家族滞在, COE申請, 妻を呼ぶ, 夫を呼ぶ, 子どもを呼ぶ | Bring family to Japan, invite spouse, invite child, dependent visa | kazoku yobiyose, kazoku taizai |
| `intent.jp.residence.renew` | `immigration.residenceRenewal.guide` | Gia hạn visa, gia hạn tư cách lưu trú, hết hạn visa, gia hạn thẻ ngoại kiều | ビザ更新, 在留期間更新, 在留カード更新, ビザが切れる | Renew visa, renew residence, visa extension, expiring visa | biza koushin, zairyuu koushin |
| `intent.jp.residence.pr` | `immigration.permanentResidence.check` | Xin vĩnh trú, làm vĩnh trú, vĩnh trú Nhật, eijyu, điều kiện vĩnh trú | 永住, 永住権, 永住許可, 永住申請, 永住チェック | Permanent residence, apply for PR, permanent resident visa | eijyu, eiju, eijyuuken |
| `intent.jp.document.obtain` | `documents.finder` | Cần giấy tờ gì, xin giấy ở đâu, in juminhyo, lấy giấy thuế, thủ tục combini | 必要書類, 証明書, 住民票, 課税証明書, コンビニ交付, 書類どこで | Get documents, certificate, juminhyo, tax certificate, convenience store print | hitsuyou shorui, shoumeisho, juminhyo |
| `intent.jp.leaving_japan` | `life.jp.leaving-japan` | Rời Nhật, về nước hẳn, thôi ở Nhật, rút nenkin, hoàn thuế nenkin | 帰国, 出国, 日本を出る, 年金脱退一時金, 転出届（国外） | Leave Japan, moving abroad, returning home, pension refund | kikoku, shukkoku, dattai ichijikin |

---

## 3. Disambiguation Rules for Ambiguous Queries

When a user query is ambiguous, Navigator does NOT jump to an arbitrary tool. Instead, it triggers a guided single-question disambiguation.

### Case 1: "Tôi muốn đổi visa" / "ビザを変えたい" (`ambiguous.visa_change`)
- **Question**: "Bạn đổi visa vì lý do gì?" / "どのような理由でビザの変更を検討していますか？"
- **Options**:
  1. **Chuyển công ty sang lĩnh vực công việc mới** $\to$ Routes to `immigration.statusChange.guide` with `changing_job` context.
  2. **Kết hôn với người Nhật hoặc người có Vĩnh trú** $\to$ Routes to `immigration.statusChange.guide` with `marriage` context.
  3. **Tốt nghiệp trường tiếng/Đại học đi làm** $\to$ Routes to `immigration.statusChange.guide` with `student_to_work` context.
  4. **Chuyển sang thành lập công ty / kinh doanh** $\to$ Educational advisory on Business Manager requirements.

### Case 2: "Tôi cần giấy thuế" / "税金の証明書が必要" (`ambiguous.tax_certificate`)
- **Question**: "Bạn cần giấy tờ thuế cho mục đích gì?" / "どの税務証明書が必要ですか？"
- **Options**:
  1. **Chứng minh thu nhập nộp cho Cục XNK hoặc thuê nhà** $\to$ Routes to `documents.certificate.guide` for `課税証明書` (Kazei Shomeisho).
  2. **Chứng minh đã nộp đủ thuế thị dân, không nợ thuế** $\to$ Routes to `documents.certificate.guide` for `納税証明書` (Nozei Shomeisho).
  3. **Chứng minh thu nhập từ công ty cấp cuối năm** $\to$ Guidance for `源泉徴収票` (Gensen Choshu Hyo from employer).
  4. **Chứng minh thuế quốc gia (thuế thu nhập cá nhân/doanh nghiệp)** $\to$ Routes to `documents.certificate.guide` for `国税納税証明書` (Zeimusho).

---

## 4. Deterministic Matching Engine
- 100% deterministic matching with normalized tokenization (Unicode normalization, lowercase, accent-agnostic Vietnamese parsing, Kana/Kanji matching, and Romaji support).
- Zero dependency on external LLM services.
