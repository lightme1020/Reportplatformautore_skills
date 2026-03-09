# AutoRe Skill & Prompt Spec

## 1. 文档定位
- 本文档是 AutoRe 技能与 Prompt 资产的单一事实源（SSOT）。
- `PRD_AutoRe_Engineering.md` 第7章仅保留索引，详细定义以本文为准。
- 适用范围：MVP当前启用链路（信息采集 + 章节生成）。

## 2. 统一工程约束
- 版本管理：每个 skill 必须维护 `schema_version`、`prompt_version`。
- 变更纪律：Prompt 或 Schema 任一变更，必须登记 `Changelog`。
- 运行审计：执行过程必须可写入 `run_log`（run_id/stage/status/error_message）。
- 输出要求：generation 类技能统一输出 `blocks` 可映射结构（或可转换为 `blocks` 的中间结构）。

## 3. 通用契约（复用）

### 3.1 EvidenceRef（MVP）
```json
{
  "type": "object",
  "required": ["object_key", "page", "source_hash"],
  "properties": {
    "object_key": { "type": "string" },
    "type": { "type": "string", "enum": ["pdf", "image"] },
    "page": { "type": "integer", "minimum": 1 },
    "snippet": { "type": "string" },
    "source_hash": { "type": "string" }
  }
}
```

### 3.2 GenerationBlock（标准化目标）
```json
{
  "type": "object",
  "required": ["type"],
  "properties": {
    "type": { "type": "string", "enum": ["text", "table", "kv_list", "note"] },
    "text": { "type": "string" },
    "table": {
      "type": "object",
      "properties": {
        "columns": { "type": "array", "items": { "type": "string" } },
        "rows": { "type": "array", "items": { "type": "array" } }
      }
    },
    "items": { "type": "array", "items": { "type": "object" } }
  }
}
```

### 3.3 GenerationCanonicalOutput（推荐）
```json
{
  "type": "object",
  "required": ["dataset_key", "meta"],
  "properties": {
    "dataset_key": { "type": "string" },
    "content": { "type": "string" },
    "table": {
      "type": "object",
      "properties": {
        "columns": { "type": "array", "items": { "type": ["string", "object"] } },
        "rows": { "type": "array", "items": { "type": "array" } }
      }
    },
    "blocks": { "type": "array", "items": { "$ref": "#/definitions/GenerationBlock" } },
    "meta": { "type": "object" }
  }
}
```

---

## 4. Declarative Skills（信息采集）

<a id="skill-concrete_table_recognition"></a>
### Skill: `concrete_table_recognition`
- type: `declarative`
- owner: `TBD`
- code_path:
  - `backend/skills_library/info_collection/concrete_table_recognition/SKILL.md`
  - `backend/skills_library/info_collection/concrete_table_recognition/scripts/qwen_client.py`
  - `backend/skills_library/info_collection/concrete_table_recognition/scripts/batch_process.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-concrete_table_recognition-io"></a>
#### I/O Contract
Input Schema（MVP）
```json
{
  "type": "object",
  "required": ["project_id", "node_id", "file"],
  "properties": {
    "project_id": { "type": "string" },
    "node_id": { "type": "string" },
    "file": { "type": "string", "description": "object_key or local path" },
    "template_hint": { "type": "string" },
    "use_llm": { "type": "boolean" }
  }
}
```
Output Schema（MVP，抽取层）
```json
{
  "type": "object",
  "required": ["records"],
  "properties": {
    "records": { "type": "array", "items": { "type": "object" } },
    "table_type": { "type": "string" },
    "warnings": { "type": "array", "items": { "type": "string" } },
    "evidence_refs": { "type": "array", "items": { "$ref": "#/definitions/EvidenceRef" } }
  }
}
```

<a id="skill-concrete_table_recognition-prompt"></a>
#### Prompt
- 来源：`backend/skills_library/info_collection/concrete_table_recognition/scripts/qwen_client.py`
- System Prompt：按图像识别表格类型，再按对应 schema 抽取字段并返回 JSON。
- User Prompt Template（MVP）
```text
请识别该页是否为混凝土检测相关表格；若是，按给定 JSON Schema 输出结构化结果。
约束：
1) 仅输出 JSON
2) 不补造不存在字段
3) 数值字段保持原始单位（MPa/mm）
输入：{{page_image_or_text}}
Schema：{{output_schema}}
```
Variables
- `page_image_or_text`: 页图或OCR文本
- `output_schema`: 当前模板对应schema

Failure Policy
- JSON不可解析：重试1次；仍失败返回 `warnings`。
- 字段缺失：允许返回 `null`，并记录 `warnings`。

Acceptance
- JSON可解析率 >= 99%
- 关键字段召回率（test_date/test_result/location）>= 95%

<a id="skill-mortar_table_recognition"></a>
### Skill: `mortar_table_recognition`
- type: `declarative`
- owner: `TBD`
- code_path:
  - `backend/skills_library/info_collection/mortar_table_recognition/skills/schema.py`
  - `backend/skills_library/info_collection/mortar_table_recognition/skills/prompt.py`
  - `backend/skills_library/info_collection/mortar_table_recognition/skills/extractor.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-mortar_table_recognition-io"></a>
#### I/O Contract
Input Schema（MVP）
```json
{
  "type": "object",
  "required": ["project_id", "node_id", "file"],
  "properties": {
    "project_id": { "type": "string" },
    "node_id": { "type": "string" },
    "file": { "type": "string" },
    "use_llm": { "type": "boolean" }
  }
}
```
Output Schema（对齐 `MortarSchema`）
```json
{
  "type": "object",
  "properties": {
    "meta": {
      "type": "object",
      "properties": {
        "table_id": { "type": ["string", "null"] },
        "record_no": { "type": ["string", "null"] },
        "test_date": { "type": ["string", "null"] },
        "instrument_model": { "type": ["string", "null"] }
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "seq": { "type": ["integer", "null"] },
          "test_location": { "type": ["string", "null"] },
          "converted_strength_mpa": { "type": ["number", "null"] },
          "estimated_strength_mpa": { "type": ["number", "null"] }
        }
      }
    },
    "notes": { "type": ["string", "null"] }
  }
}
```

<a id="skill-mortar_table_recognition-prompt"></a>
#### Prompt
- 来源：`backend/skills_library/info_collection/mortar_table_recognition/skills/prompt.py`
- System Prompt：砂浆强度表格字段抽取，严格 JSON Schema。
- User Prompt Template
```text
请从图像中提取砂浆强度检测表数据，并按 Schema 返回。
要求：
- 不输出解释文字
- 未识别字段返回 null
- rows 保持原顺序
Schema: {{output_schema}}
```

<a id="skill-brick_table_recognition"></a>
### Skill: `brick_table_recognition`
- type: `declarative`
- owner: `TBD`
- code_path:
  - `backend/skills_library/info_collection/brick_table_recognition/skills/schema.py`
  - `backend/skills_library/info_collection/brick_table_recognition/skills/prompt.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-brick_table_recognition-io"></a>
#### I/O Contract
Input Schema（MVP）
```json
{
  "type": "object",
  "required": ["project_id", "node_id", "file"],
  "properties": {
    "project_id": { "type": "string" },
    "node_id": { "type": "string" },
    "file": { "type": "string" },
    "use_llm": { "type": "boolean" }
  }
}
```
Output Schema（对齐 `BrickStrengthRecord`）
```json
{
  "type": "object",
  "properties": {
    "table_id": { "type": ["string", "null"] },
    "test_date": { "type": ["string", "null"] },
    "instrument_id": { "type": ["string", "null"] },
    "brick_type": { "type": ["string", "null"] },
    "strength_grade": { "type": ["string", "null"] },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "seq": { "type": ["integer", "null"] },
          "test_location": { "type": ["string", "null"] },
          "estimated_strength_mpa": { "type": ["number", "null"] }
        }
      }
    }
  }
}
```

<a id="skill-brick_table_recognition-prompt"></a>
#### Prompt
- 来源：`backend/skills_library/info_collection/brick_table_recognition/skills/prompt.py` 中 `SYSTEM_PROMPT`
- User Prompt Template
```text
Extract brick strength table data from input image.
Return JSON only and conform to schema.
Do not fabricate values.
Schema: {{output_schema}}
```

<a id="skill-delegate_info_recognition"></a>
### Skill: `delegate_info_recognition`
- type: `declarative`
- owner: `TBD`
- code_path:
  - `backend/skills_library/info_collection/delegate_info_recognition/skills/schema.py`
  - `backend/skills_library/info_collection/delegate_info_recognition/skills/prompt.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-delegate_info_recognition-io"></a>
#### I/O Contract
Input Schema（MVP）
```json
{
  "type": "object",
  "required": ["project_id", "node_id", "file"],
  "properties": {
    "project_id": { "type": "string" },
    "node_id": { "type": "string" },
    "file": { "type": "string" }
  }
}
```
Output Schema（对齐 `get_json_schema()`）
```json
{
  "type": "object",
  "required": ["meta"],
  "properties": {
    "meta": {
      "type": "object",
      "properties": {
        "control_id": { "type": ["string", "null"] },
        "record_no": { "type": ["string", "null"] },
        "client_org": { "type": ["string", "null"] },
        "inspection_reason": { "type": ["string", "null"] },
        "inspection_basis": { "type": ["string", "null"] },
        "instrument_id": { "type": ["string", "null"] },
        "inspection_date": { "type": ["string", "null"] },
        "house_name": { "type": ["string", "null"] }
      }
    },
    "house_details": { "type": ["string", "null"] },
    "notes": { "type": ["string", "null"] }
  }
}
```

<a id="skill-delegate_info_recognition-prompt"></a>
#### Prompt
- 来源：`backend/skills_library/info_collection/delegate_info_recognition/skills/prompt.py`
- User Prompt Template
```text
请从委托信息/基础信息页提取字段，按指定JSON结构输出。
要求：
1) 只输出JSON
2) 不能识别返回null
3) 日期尽量标准化为 YYYY-MM-DD
```

<a id="skill-software_calculation_recognition"></a>
### Skill: `software_calculation_recognition`
- type: `declarative`（当前实现偏规则解析）
- owner: `TBD`
- code_path:
  - `backend/skills_library/info_collection/software_calculation_recognition/parse.py`
  - `backend/skills_library/info_collection/software_calculation_recognition/fields.yaml`
- schema_version: `1.0.0`
- prompt_version: `N/A`（当前以规则抽取为主）

<a id="skill-software_calculation_recognition-io"></a>
#### I/O Contract
Input Schema（MVP）
```json
{
  "type": "object",
  "required": ["file"],
  "properties": {
    "file": { "type": "string" },
    "parser": { "type": "string", "enum": ["regex_v1"] }
  }
}
```
Output Schema（对齐 fields.yaml + parse.py）
```json
{
  "type": "object",
  "properties": {
    "meta": { "type": "object" },
    "mortar_strength_mpa": { "type": "number" },
    "brick_strength_grade": { "type": "string" },
    "live_loads": { "type": "object" },
    "dead_loads": { "type": "object" },
    "load_combination_type": { "type": "string" },
    "wind_snow_terrain": { "type": "object" },
    "defaults_applied": { "type": "array", "items": { "type": "string" } }
  }
}
```

<a id="skill-software_calculation_recognition-prompt"></a>
#### Prompt
- 当前状态：不依赖LLM主Prompt，按正则/规则抽取。
- 预留模板（Phase-1可启用）
```text
请从计算书中提取荷载与计算参数，按Schema输出JSON。
```

---

## 5. Generation Skills（章节生成）

> 说明：以下 generation skill 当前实现以 `project_id/node_id/context` 查询专业库并生成章节结构。输出应可映射到 `blocks`。

<a id="skill-parse_concrete_strength"></a>
### Skill: `parse_concrete_strength`
- dataset_key: `concrete_strength` / `concrete_strength_comprehensive`
- code_path: `backend/skills_library/generation/inspection/material_strength/subskills/concrete_strength/impl/parse.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`（描述生成模板）

<a id="skill-parse_concrete_strength-io"></a>
#### I/O Contract
Input Schema
```json
{
  "type": "object",
  "required": ["project_id", "node_id"],
  "properties": {
    "project_id": { "type": "string" },
    "node_id": { "type": "string" },
    "context": { "type": "object" }
  }
}
```
Output Schema
```json
{
  "type": "object",
  "required": ["dataset_key", "content", "table", "meta"],
  "properties": {
    "dataset_key": { "type": "string", "enum": ["concrete_strength"] },
    "content": { "type": "string" },
    "table": { "type": "object" },
    "meta": { "type": "object" }
  }
}
```

<a id="skill-parse_concrete_strength-prompt"></a>
#### Prompt
- 角色：工程报告文本生成助手
- 约束：只基于事实表生成描述，不引入未提供数据，不擅自计算。

<a id="skill-parse_mortar_strength"></a>
### Skill: `parse_mortar_strength`
- dataset_key: `mortar_strength`
- code_path: `backend/skills_library/generation/inspection/material_strength/subskills/mortar_strength/impl/parse.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-parse_mortar_strength-io"></a>
#### I/O Contract
Input Schema / Output Schema 与 `parse_concrete_strength` 同构，`dataset_key = mortar_strength`。

<a id="skill-parse_mortar_strength-prompt"></a>
#### Prompt
- 文本模板重点：规程引用、检测方法、强度范围描述。

<a id="skill-parse_brick_strength"></a>
### Skill: `parse_brick_strength`
- dataset_key: `brick_strength`
- code_path: `backend/skills_library/generation/inspection/material_strength/subskills/brick_strength/impl/parse.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-parse_brick_strength-io"></a>
#### I/O Contract
Input Schema / Output Schema 与 `parse_concrete_strength` 同构，`dataset_key = brick_strength`。

<a id="skill-parse_brick_strength-prompt"></a>
#### Prompt
- 文本模板重点：标准引用、方法说明、范围结论。

<a id="skill-generate_inspection_content_and_methods_async"></a>
### Skill: `generate_inspection_content_and_methods_async`
- dataset_key: `inspection_content_and_methods`
- code_path: `backend/skills_library/generation/inspection/inspection_content_and_methods/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_inspection_content_and_methods_async-io"></a>
#### I/O Contract
Input Schema
```json
{
  "type": "object",
  "required": ["project_id", "node_id"],
  "properties": {
    "project_id": { "type": "string" },
    "node_id": { "type": "string" },
    "context": { "type": "object" }
  }
}
```
Output Schema
```json
{
  "type": "object",
  "required": ["dataset_key", "meta"],
  "properties": {
    "dataset_key": { "type": "string", "enum": ["inspection_content_and_methods"] },
    "content": { "type": "string" },
    "table": { "type": "object" },
    "blocks": { "type": "array" },
    "meta": { "type": "object" }
  }
}
```

<a id="skill-generate_inspection_content_and_methods_async-prompt"></a>
#### Prompt
- 目标：生成“鉴定内容和方法及原始记录一览表”章节。
- 约束：优先引用已确认数据，不补造试验结果。

<a id="skill-generate_inspection_basis_async"></a>
### Skill: `generate_inspection_basis_async`
- dataset_key: `inspection_basis`
- code_path: `backend/skills_library/generation/inspection/inspection_basis/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_inspection_basis_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = inspection_basis`。

<a id="skill-generate_inspection_basis_async-prompt"></a>
#### Prompt
```text
根据项目检测范围与数据来源，输出“检测鉴定依据”章节。
约束：仅引用已配置规范，不扩展未批准规范。
```

<a id="skill-generate_detailed_inspection_async"></a>
### Skill: `generate_detailed_inspection_async`
- dataset_key: `detailed_inspection`
- code_path: `backend/skills_library/generation/inspection/detailed_inspection/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_detailed_inspection_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = detailed_inspection`。

<a id="skill-generate_detailed_inspection_async-prompt"></a>
#### Prompt
- 目标：基于现场记录生成“详细检查情况”。
- 约束：描述与证据一致，风险描述禁止夸张。

<a id="skill-generate_basic_situation_async"></a>
### Skill: `generate_basic_situation_async`
- dataset_key: `basic_situation`
- code_path: `backend/skills_library/generation/inspection/basic_situation/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_basic_situation_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = basic_situation`。

<a id="skill-generate_basic_situation_async-prompt"></a>
#### Prompt
- 目标：输出基础信息（kv + 简述）。
- 约束：字段缺失可空，不自行推断行政信息。

<a id="skill-generate_house_overview_async"></a>
### Skill: `generate_house_overview_async`
- dataset_key: `house_overview`
- code_path: `backend/skills_library/generation/inspection/house_overview/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_house_overview_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = house_overview`。

<a id="skill-generate_house_overview_async-prompt"></a>
#### Prompt
- 目标：生成“房屋概况”。
- 约束：信息来源优先委托与基础信息节点。

<a id="skill-generate_load_calc_params_async"></a>
### Skill: `generate_load_calc_params_async`
- dataset_key: `load_calc_params`
- code_path: `backend/skills_library/generation/inspection/load_calc_params/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_load_calc_params_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = load_calc_params`。

<a id="skill-generate_load_calc_params_async-prompt"></a>
#### Prompt
- 目标：输出荷载及计算参数取值。
- 约束：参数值优先 software_calculation 识别结果，缺失时标注来源/默认策略。

<a id="skill-generate_bearing_capacity_review_async"></a>
### Skill: `generate_bearing_capacity_review_async`
- dataset_key: `bearing_capacity_review`
- code_path: `backend/skills_library/generation/inspection/bearing_capacity_review/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_bearing_capacity_review_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = bearing_capacity_review`。

<a id="skill-generate_bearing_capacity_review_async-prompt"></a>
#### Prompt
- 目标：输出承载能力复核验算结论与关键表格。
- 约束：结论可追溯到输入参数与计算依据。

<a id="skill-generate_analysis_explanation_async"></a>
### Skill: `generate_analysis_explanation_async`
- dataset_key: `analysis_explanation`
- code_path: `backend/skills_library/generation/inspection/analysis_explanation/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_analysis_explanation_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = analysis_explanation`。

<a id="skill-generate_analysis_explanation_async-prompt"></a>
#### Prompt
- 当前策略：静态模板优先，必要时轻量动态替换。

<a id="skill-generate_opinion_and_suggestions_async"></a>
### Skill: `generate_opinion_and_suggestions_async`
- dataset_key: `opinion_and_suggestions`
- code_path: `backend/skills_library/generation/inspection/opinion_and_suggestions/impl/generate.py`
- schema_version: `1.0.0`
- prompt_version: `1.0.0`

<a id="skill-generate_opinion_and_suggestions_async-io"></a>
#### I/O Contract
Input Schema / Output Schema 结构同上，`dataset_key = opinion_and_suggestions`。

<a id="skill-generate_opinion_and_suggestions_async-prompt"></a>
#### Prompt
```text
根据前序章节结论输出“鉴定意见及处理建议”。
约束：
- 先结论后建议
- 禁止超出鉴定范围
- 用词符合工程报告规范
```

---

## 6. 统一失败处理策略
- `parse/declarative`：
  - JSON解析失败 -> 重试1次
  - 二次失败 -> 返回 `status=failed` + `errors[]`，不自动落库
- `mapping/validation`：
  - `validation.is_valid=false` -> 必须人工确认
- `generation`：
  - 数据不足 -> 返回空章节骨架 + `meta.warnings`
  - 生成失败 -> 返回错误码并写 `run_log`

## 7. 验收标准（MVP）
- 契约层：所有已接入技能存在明确 input/output schema。
- 可追溯：生成章节可回溯 `dataset_key` 与数据来源节点。
- 可回滚：Prompt/Schema 版本可定位到变更记录。

## 8. Changelog
| date | skill_id | schema_version | prompt_version | change | owner |
|---|---|---|---|---|---|
| 2026-03-01 | all (init) | 1.0.0 | 1.0.0 | 初始化 Skill&Prompt 规范文档（MVP） | TBD |
