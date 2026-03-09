# 信息采集 Skills 梳理（领域 -> 模块 -> 功能 -> 子功能）

| 领域 | 模块 | 功能 | 子功能 | 对应 Skill |
|---|---|---|---|---|
| 信息采集 | 检测前信息 | 委托资料识别 | 控制编号/原始记录号提取（`control_id`、`record_no`） | `delegate-info-recognition` |
| 信息采集 | 检测前信息 | 委托资料识别 | 委托单位/检测原因/检测依据提取（`client_org`、`inspection_reason`、`inspection_basis`） | `delegate-info-recognition` |
| 信息采集 | 检测前信息 | 委托资料识别 | 仪器编号/检测日期/房屋名称提取（`instrument_id`、`inspection_date`、`house_name`） | `delegate-info-recognition` |
| 信息采集 | 检测前信息 | 委托资料识别 | 房屋概况整段归并（`house_details`） | `delegate-info-recognition` |
| 信息采集 | 检测中数据 | 砂浆强度表识别 | 表头信息提取（`table_id`、`record_no`、`test_date`、`instrument_model`） | `mortar-strength-recognition` |
| 信息采集 | 检测中数据 | 砂浆强度表识别 | 行级提取（`seq`、`test_location`、`converted_strength_mpa`、`estimated_strength_mpa`） | `mortar-strength-recognition` |
| 信息采集 | 检测中数据 | 砂浆强度表识别 | 数值/日期规范化与空值处理（`null`、精度规则） | `mortar-strength-recognition` |
| 信息采集 | 检测中数据 | 砖强度表识别 | 表头信息提取（`table_id`、`test_date`、`instrument_id`、`brick_type`、`strength_grade`） | `brick-strength-recognition` |
| 信息采集 | 检测中数据 | 砖强度表识别 | 行级部位与推定值提取（`rows[].test_location`、`rows[].estimated_strength_mpa`） | `brick-strength-recognition` |
| 信息采集 | 检测中数据 | 混凝土表识别 | 表型分类（`concrete_strength_sheet` / `concrete_strength_grid`） | `concrete-table-recognition` |
| 信息采集 | 检测中数据 | 混凝土表识别 | 回弹记录表字段提取（检测日期/原因/方法/部位/品种/强度等级/施工日期列表） | `concrete-table-recognition` |
| 信息采集 | 检测中数据 | 混凝土表识别 | 强度结果表字段提取（控制标号/设计强度/碳化深度/最小值/平均值/标准差/推定值） | `concrete-table-recognition` |
| 信息采集 | 结构现状信息 | 结构损伤与变动识别 | 元数据提取（`control_id`、`record_no`、`instrument_id`、`test_date`、`house_name`） | `structure-damage-alterations-recognition` |
| 信息采集 | 结构现状信息 | 结构损伤与变动识别 | 行级拆改项提取（`modification_location`、`modification_description`、`photo_no`） | `structure-damage-alterations-recognition` |
| 信息采集 | 结构现状信息 | 结构损伤与变动识别 | 签名信息提取（`inspector`、`recorder`、`reviewer`） | `structure-damage-alterations-recognition` |
| 信息采集 | 检测后数据 | 软件计算结果识别 | 材料参数提取（`mortar_strength_mpa`、`brick_strength_grade`） | `software_calculation_recognition` |
| 信息采集 | 检测后数据 | 软件计算结果识别 | 荷载参数提取（`live_loads.*`、`dead_loads.*`、`load_combination_type`） | `software_calculation_recognition` |
| 信息采集 | 检测后数据 | 软件计算结果识别 | 环境参数提取（`basic_wind_pressure`、`basic_snow_pressure`、`terrain_category`） | `software_calculation_recognition` |
| 信息采集 | 检测后数据 | 软件计算结果识别 | 缺失值自动补默认并记录（`defaults_applied`） | `software_calculation_recognition` |

## 清单（单独）

1. `delegate-info-recognition`（委托信息识别）
2. `mortar-strength-recognition`（砂浆强度表识别）
3. `brick-strength-recognition`（砖强度表识别）
4. `concrete-table-recognition`（混凝土表识别）
5. `structure-damage-alterations-recognition`（结构损伤与变动识别）
6. `software_calculation_recognition`（软件计算结果识别）
