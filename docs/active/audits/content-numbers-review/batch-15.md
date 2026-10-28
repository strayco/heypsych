# Batch 15: numbers to review

Left unchanged in the records; verify against the source before correcting.

| File | Field | Value | Why it looks off |
| --- | --- | --- | --- |
| data/learn/exercise-vs-antidepressants-study.json | content[2].text | "A 2023 meta-analysis of 218 studies" | Same study as data/learn/exercise-vs-antidepressants.json content[2] (BMJ, 218 randomized trials), which dates it 2024. Year likely wrong in one of the two. |
| data/learn/cbt-complete-guide.json vs data/learn/cbt-explained.json | content[17].text / content[22].text | GAD effect size d=0.80 vs 0.82 | Same claim, different value across two articles; other values match. |
| data/learn/social-media-mental-health.json | content[3].text | "226 studies ... r=0.15-0.20 — comparable to eating potatoes" | The "eating potatoes" comparison (Orben & Przybylski 2019) described a much smaller association (about 0.4% of variance, r near 0.04-0.06); r=0.15-0.20 and the potatoes comparison do not fit together, and the 226-study count needs a source. |
