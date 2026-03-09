# 前端接口契约（UI/UX 交付版）

本文件基于当前前端实际调用整理，目标是给前端开发直接联调或 mock 开发。

## 0. 基础约定

- Base URL: 默认同域 `/api`。
- 可通过环境变量覆盖：`VITE_API_BASE_URL`。
- 常见错误结构（后端 FastAPI + 业务层）：
  - `{ "detail": "..." }`
  - 或 `{ "message": "..." }`
- 文件上传接口使用 `multipart/form-data`。

## 1. 获取采集节点模板

- Method: `GET`
- URL: `/api/collection/node-templates`
- 用途: 初始化“信息采集”节点模板。

### 成功响应（200）
见 `mocks/collection-node-templates.success.json`

---

## 2. 智能编排（自动识别技能）

- Method: `POST`
- URL: `/api/skill/orchestrate`
- Content-Type: `multipart/form-data`
- 用途: 上传文件后自动识别并调用对应技能。

### Request FormData
- `files`: File（可多文件，前端当前一次一个）
- `project_id`: string（必填）
- `node_id`: string（必填）
- `persist_result`: `"true"|"false"`（当前前端传 `false`）
- `use_llm_classification`: `"true"|"false"`（当前前端传 `true`）

### 成功响应（200）
见 `mocks/skill-orchestrate.success.json`

### 前端关注字段
- `results[].file_name`
- `results[].success`
- `results[].classification.skill_name`
- `results[].classification.file_type`
- `results[].data`（结构化抽取结果）
- `results[].records`
- `results[].source_hash`

---

## 3. 指定技能执行

- Method: `POST`
- URL: `/api/skill/{skill_name}/run`
- Content-Type: `multipart/form-data`
- 用途: 用户手动选技能后执行。

### Path
- `skill_name`: string

### Request FormData
- `file`: File（必填）
- `format`: string（当前前端固定 `json`）
- `project_id`: string
- `node_id`: string
- `persist_result`: `"true"|"false"`（当前前端传 `false`）

### 成功响应（200）
见 `mocks/skill-run.success.json`

### 前端关注字段
- `success`
- `error`
- `data`
- `records`
- `run_id`
- `source_hash`

---

## 4. 确认抽取结果并入库

- Method: `POST`
- URL: `/api/skill/confirm`
- Content-Type: `application/json`
- 用途: 用户确认编辑后的结构化结果。

### Request Body
- `project_id`: string（必填）
- `node_id`: string（必填）
- `source_hash`: string（必填）
- `skill_name`: string（必填）
- `run_id`: string（可选）
- `records`: any[]（必填，空数组会报错）

### 成功响应（200）
见 `mocks/skill-confirm.success.json`

---

## 5. 技能列表

- Method: `GET`
- URL: `/api/skills/list`
- 用途: 技能选择器下拉。

### 成功响应（200）
见 `mocks/skills-list.success.json`

---

## 6. 技能详情

- Method: `GET`
- URL: `/api/skill/{skill_name}/info`
- 用途: 展示技能展示名、描述、分组等。

### 成功响应（200）
见 `mocks/skill-info.success.json`

---

## 7. 生成报告章节

- Method: `POST`
- URL: `/api/report/generate`
- Content-Type: `application/json`
- 用途: 按章节生成报告预览内容。

### Request Body
- `project_id`: string（必填）
- `chapter_config`: object（必填）
  - `node_id`: string
  - `chapter_id`: string
  - `title`: string
  - `dataset_key`: string
  - `sourceNodeId`: string | null
  - `context`: object
- `project_context`: object（必填，当前前端传 `{}`）

### 成功响应（200）
见 `mocks/report-generate.success.json`

### 前端关注字段
- `report_id`
- `chapters[]`
  - `chapter_id`
  - `title`
  - `chapter_content.blocks[]`
  - `summary`
  - `evidence_refs`

---

## 8. 常见错误响应

见 `mocks/error.common.json`

---

## 9. 建议给前端的最小交付包

- `API_CONTRACT.md`
- `types.ts`
- `mocks/*.json`

