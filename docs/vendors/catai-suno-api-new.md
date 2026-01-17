# 获取结果

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/v2/sunoinfo:
    get:
      summary: 获取结果
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters:
        - name: id
          in: query
          description: ''
          required: false
          example: f5aaff05ad134cc3b7b4a51944420edb
          schema:
            type: string
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: object
                    properties:
                      id:
                        type: string
                      taskType:
                        type: string
                      status:
                        type: string
                      errorMsg:
                        type: string
                      param:
                        type: object
                        properties:
                          task:
                            type: string
                          model:
                            type: string
                          customMode:
                            type: boolean
                          makeInstrumental:
                            type: boolean
                          prompt:
                            type: string
                          tags:
                            type: string
                          negativeTags:
                            type: string
                          title:
                            type: string
                          vocalGender:
                            type: string
                          styleWeight:
                            type: number
                          weirdnessConstraint:
                            type: number
                          audioWeight:
                            type: number
                        required:
                          - task
                          - model
                          - customMode
                          - makeInstrumental
                          - prompt
                          - tags
                          - negativeTags
                          - title
                          - vocalGender
                          - styleWeight
                          - weirdnessConstraint
                          - audioWeight
                        x-apifox-orders:
                          - task
                          - model
                          - customMode
                          - makeInstrumental
                          - prompt
                          - tags
                          - negativeTags
                          - title
                          - vocalGender
                          - styleWeight
                          - weirdnessConstraint
                          - audioWeight
                      result:
                        type: array
                        items:
                          type: object
                          properties:
                            id:
                              type: string
                            title:
                              type: string
                            handle:
                              type: string
                            status:
                              type: string
                            user_id:
                              type: string
                            explicit:
                              type: boolean
                            has_hook:
                              type: boolean
                            is_liked:
                              type: boolean
                            metadata:
                              type: object
                              properties:
                                tags:
                                  type: string
                                type:
                                  type: string
                                prompt:
                                  type: string
                                stream:
                                  type: boolean
                                duration:
                                  type: number
                                has_stem:
                                  type: boolean
                                is_remix:
                                  type: boolean
                                priority:
                                  type: integer
                                can_remix:
                                  type: boolean
                                model_badges:
                                  type: object
                                  properties:
                                    songrow:
                                      type: object
                                      properties:
                                        dark:
                                          type: object
                                          properties:
                                            text_color:
                                              type: string
                                            border_color:
                                              type: string
                                            background_color:
                                              type: string
                                          required:
                                            - text_color
                                            - border_color
                                            - background_color
                                          x-apifox-orders:
                                            - text_color
                                            - border_color
                                            - background_color
                                        light:
                                          type: object
                                          properties:
                                            text_color:
                                              type: string
                                            border_color:
                                              type: string
                                            background_color:
                                              type: string
                                          required:
                                            - text_color
                                            - border_color
                                            - background_color
                                          x-apifox-orders:
                                            - text_color
                                            - border_color
                                            - background_color
                                        display_name:
                                          type: string
                                      required:
                                        - dark
                                        - light
                                        - display_name
                                      x-apifox-orders:
                                        - dark
                                        - light
                                        - display_name
                                    songcard:
                                      type: object
                                      properties:
                                        dark:
                                          type: object
                                          properties:
                                            text_color:
                                              type: string
                                            border_color:
                                              type: string
                                            background_color:
                                              type: string
                                          required:
                                            - text_color
                                            - border_color
                                            - background_color
                                          x-apifox-orders:
                                            - text_color
                                            - border_color
                                            - background_color
                                        light:
                                          type: object
                                          properties:
                                            text_color:
                                              type: string
                                            border_color:
                                              type: string
                                            background_color:
                                              type: string
                                          required:
                                            - text_color
                                            - border_color
                                            - background_color
                                          x-apifox-orders:
                                            - text_color
                                            - border_color
                                            - background_color
                                        display_name:
                                          type: string
                                      required:
                                        - dark
                                        - light
                                        - display_name
                                      x-apifox-orders:
                                        - dark
                                        - light
                                        - display_name
                                  required:
                                    - songrow
                                    - songcard
                                  x-apifox-orders:
                                    - songrow
                                    - songcard
                                negative_tags:
                                  type: string
                                refund_credits:
                                  type: boolean
                                control_sliders:
                                  type: object
                                  properties:
                                    audio_weight:
                                      type: number
                                    style_weight:
                                      type: number
                                    weirdness_constraint:
                                      type: number
                                  required:
                                    - audio_weight
                                    - style_weight
                                    - weirdness_constraint
                                  x-apifox-orders:
                                    - audio_weight
                                    - style_weight
                                    - weirdness_constraint
                                make_instrumental:
                                  type: boolean
                                uses_latest_model:
                                  type: boolean
                              required:
                                - tags
                                - type
                                - prompt
                                - stream
                                - duration
                                - has_stem
                                - is_remix
                                - priority
                                - can_remix
                                - model_badges
                                - negative_tags
                                - refund_credits
                                - control_sliders
                                - make_instrumental
                                - uses_latest_model
                              x-apifox-orders:
                                - tags
                                - type
                                - prompt
                                - stream
                                - duration
                                - has_stem
                                - is_remix
                                - priority
                                - can_remix
                                - model_badges
                                - negative_tags
                                - refund_credits
                                - control_sliders
                                - make_instrumental
                                - uses_latest_model
                            audio_url:
                              type: string
                            image_url:
                              type: string
                            is_public:
                              type: boolean
                            video_url:
                              type: string
                            created_at:
                              type: string
                            flag_count:
                              type: integer
                            is_trashed:
                              type: boolean
                            model_name:
                              type: string
                            play_count:
                              type: integer
                            batch_index:
                              type: integer
                            entity_type:
                              type: string
                            display_name:
                              type: string
                            upvote_count:
                              type: integer
                            comment_count:
                              type: integer
                            allow_comments:
                              type: boolean
                            image_large_url:
                              type: string
                            is_contest_clip:
                              type: boolean
                            avatar_image_url:
                              type: string
                            is_handle_updated:
                              type: boolean
                            major_model_version:
                              type: string
                          required:
                            - id
                            - title
                            - handle
                            - status
                            - user_id
                            - explicit
                            - has_hook
                            - is_liked
                            - metadata
                            - audio_url
                            - image_url
                            - is_public
                            - video_url
                            - created_at
                            - flag_count
                            - is_trashed
                            - model_name
                            - play_count
                            - batch_index
                            - entity_type
                            - display_name
                            - upvote_count
                            - comment_count
                            - allow_comments
                            - image_large_url
                            - is_contest_clip
                            - avatar_image_url
                            - is_handle_updated
                            - major_model_version
                          x-apifox-orders:
                            - id
                            - title
                            - handle
                            - status
                            - user_id
                            - explicit
                            - has_hook
                            - is_liked
                            - metadata
                            - audio_url
                            - image_url
                            - is_public
                            - video_url
                            - created_at
                            - flag_count
                            - is_trashed
                            - model_name
                            - play_count
                            - batch_index
                            - entity_type
                            - display_name
                            - upvote_count
                            - comment_count
                            - allow_comments
                            - image_large_url
                            - is_contest_clip
                            - avatar_image_url
                            - is_handle_updated
                            - major_model_version
                      createTime:
                        type: string
                      completeTime:
                        type: string
                    required:
                      - id
                      - taskType
                      - status
                      - errorMsg
                      - param
                      - result
                      - createTime
                      - completeTime
                    x-apifox-orders:
                      - id
                      - taskType
                      - status
                      - errorMsg
                      - param
                      - result
                      - createTime
                      - completeTime
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403103082-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 创建音乐

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 创建音乐
      deprecated: false
      description: >-
        ## 使用指南

        - 此接口根据您的文本提示创建音乐

        - 每个请求会生成多个变体

        - 您可以通过自定义模式和纯音乐设置来控制细节级别


        ## 参数说明（task 为 create）

        - 模型（model）：
          - v40, v45, v45+, v45-lite, v50
        - 自定义模式下（customMode: true）:
          - makeInstrumental: true：需提供 style 和 title
          - makeInstrumental: false：需提供 style、prompt 和 title
          - 不同模型的字符限制：
            - V3_5 和 V4：prompt 3000字符，style 200字符
            - V4_5 和 V4_5PLUS：prompt 5000字符，style 1000字符
            - V50：prompt 5000字符，style 1000字符
          - title 长度限制：80字符（所有模型）
        - 非自定义模式下（customMode: false）:
          - 无论 makeInstrumental 设置如何，仅需提供 prompt
          - prompt 长度限制：400字符
          - 其他参数应留空
        ## 开发者注意事项

        - 新用户建议：以 custom_mode: false 开始使用，更简单

        - 回调过程分三个阶段：text（文本生成）、first（第一首完成）、complete（全部完成）

        ## 可选参数

        - vocalGender（string）: 人声性别偏好。m 男声，f 女声。

        - styleWeight（number）: 对风格的遵循强度。范围 0–1，保留两位小数。示例：0.65。

        - weirdnessConstraint（number）: 创意/离散程度。范围 0–1，保留两位小数。示例：0.65。

        - audioWeight（number）: 音频要素权重。范围 0–1，保留两位小数。示例：0.65。

        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                model:
                  type: string
                customMode:
                  type: boolean
                makeInstrumental:
                  type: boolean
                prompt:
                  type: string
                tags:
                  type: string
                negativeTags:
                  type: string
                title:
                  type: string
                vocalGender:
                  type: string
                styleWeight:
                  type: number
                weirdnessConstraint:
                  type: number
                audioWeight:
                  type: number
              required:
                - task
                - model
                - customMode
                - makeInstrumental
                - prompt
                - tags
                - negativeTags
                - title
                - vocalGender
                - styleWeight
                - weirdnessConstraint
                - audioWeight
              x-apifox-orders:
                - task
                - model
                - customMode
                - makeInstrumental
                - prompt
                - tags
                - negativeTags
                - title
                - vocalGender
                - styleWeight
                - weirdnessConstraint
                - audioWeight
            example:
              task: create
              model: v50
              customMode: true
              makeInstrumental: false
              prompt: >-
                两只老虎 两只老虎跑得慢 跑得慢一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎 两只老虎跑得快
                跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎 两只老虎跑得快 跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎
                两只老虎跑得快 跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎 两只老虎跑得快 跑得快一只没有耳朵一只没有尾巴真奇怪
                真奇怪两只老虎 两只老虎跑得快 跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎 两只老虎跑得快
                跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎 两只老虎跑得快 跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪
              tags: Happy
              negativeTags: Sad, Slow
              title: 两只老虎
              vocalGender: f
              styleWeight: 0.65
              weirdnessConstraint: 0.65
              audioWeight: 0.65
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403102135-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 扩展音乐

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 扩展音乐
      deprecated: false
      description: >-
        ## 使用指南

        - 此接口根据您的文本提示创建音乐

        - 每个请求会生成多个变体

        - 您可以通过自定义模式和纯音乐设置来控制细节级别


        ## 参数说明（task 为 extend）

        - 模型（model）：
          - v40, v45, v45+, v45-lite, v50
        - 歌曲ID（clipId）：
          - 需要输入需要扩展的ID。来源于歌曲结果的”id“ 如：4f51f49d-8875-442d-9a66-81a7e66d55d6
        - 续写开始时间（continueAt）
          - 定义从第几秒开始续写歌曲
        - 自定义模式下（customMode: true）:
          - makeInstrumental: true：需提供 style 和 title
          - makeInstrumental: false：需提供 style、prompt 和 title
          - 不同模型的字符限制：
            - V3_5 和 V4：prompt 3000字符，style 200字符
            - V4_5 和 V4_5PLUS：prompt 5000字符，style 1000字符
            - V50：prompt 5000字符，style 1000字符
          - title 长度限制：80字符（所有模型）
        - 非自定义模式下（customMode: false）:
          - 无论 makeInstrumental 设置如何，仅需提供 prompt
          - prompt 长度限制：400字符
          - 其他参数应留空
        ## 开发者注意事项

        - 新用户建议：以 custom_mode: false 开始使用，更简单

        - 回调过程分三个阶段：text（文本生成）、first（第一首完成）、complete（全部完成）

        ## 可选参数

        - vocalGender（string）: 人声性别偏好。m 男声，f 女声。

        - styleWeight（number）: 对风格的遵循强度。范围 0–1，保留两位小数。示例：0.65。

        - weirdnessConstraint（number）: 创意/离散程度。范围 0–1，保留两位小数。示例：0.65。

        - audioWeight（number）: 音频要素权重。范围 0–1，保留两位小数。示例：0.65。

        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                model:
                  type: string
                customMode:
                  type: boolean
                clipId:
                  type: string
                continueAt:
                  type: integer
                makeInstrumental:
                  type: boolean
                prompt:
                  type: string
                tags:
                  type: string
                negativeTags:
                  type: string
                title:
                  type: string
                styleWeight:
                  type: number
                weirdnessConstraint:
                  type: number
                audioWeight:
                  type: number
              required:
                - task
                - model
                - customMode
                - clipId
                - continueAt
                - makeInstrumental
                - prompt
                - tags
                - negativeTags
                - title
                - styleWeight
                - weirdnessConstraint
                - audioWeight
            example:
              task: extend
              model: v45
              customMode: false
              clipId: 05d72140-38f5-4eb4-bdaa-a6e0d1c1167e
              continueAt: 60
              makeInstrumental: false
              prompt: Upbeat EDM about sunrise and new beginnings.
              tags: Happy, Party
              negativeTags: Hip-Hop/Rap
              title: Roadtrip Sunrise2
              styleWeight: 0.65
              weirdnessConstraint: 0.65
              audioWeight: 0.65
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403145784-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 翻唱音乐

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 翻唱音乐
      deprecated: false
      description: >-
        ## 使用指南

        - 此接口根据您的文本提示创建音乐

        - 每个请求会生成多个变体

        - 您可以通过自定义模式和纯音乐设置来控制细节级别


        ## 参数说明（task 为 cover）

        - 模型（model）：
          - v40, v45, v45+, v45-lite, v50
        - 歌曲ID（clipId）：
          - 需要输入需要扩展的ID。来源于歌曲结果的”id“ 如：4f51f49d-8875-442d-9a66-81a7e66d55d6
        - 自定义模式下（customMode: true）:
          - makeInstrumental: true：需提供 style 和 title
          - makeInstrumental: false：需提供 style、prompt 和 title
          - 不同模型的字符限制：
            - V3_5 和 V4：prompt 3000字符，style 200字符
            - V4_5 和 V4_5PLUS：prompt 5000字符，style 1000字符
            - V50：prompt 5000字符，style 1000字符
          - title 长度限制：80字符（所有模型）
        - 非自定义模式下（customMode: false）:
          - 无论 makeInstrumental 设置如何，仅需提供 prompt
          - prompt 长度限制：400字符
          - 其他参数应留空
        ## 开发者注意事项

        - 新用户建议：以 custom_mode: false 开始使用，更简单

        - 回调过程分三个阶段：text（文本生成）、first（第一首完成）、complete（全部完成）

        ## 可选参数

        - vocalGender（string）: 人声性别偏好。m 男声，f 女声。

        - styleWeight（number）: 对风格的遵循强度。范围 0–1，保留两位小数。示例：0.65。

        - weirdnessConstraint（number）: 创意/离散程度。范围 0–1，保留两位小数。示例：0.65。

        - audioWeight（number）: 音频要素权重。范围 0–1，保留两位小数。示例：0.65。

        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                model:
                  type: string
                customMode:
                  type: boolean
                clipId:
                  type: string
                makeInstrumental:
                  type: boolean
                prompt:
                  type: string
                tags:
                  type: string
                title:
                  type: string
                vocalGender:
                  type: string
                styleWeight:
                  type: number
                weirdnessConstraint:
                  type: number
                audioWeight:
                  type: number
                negativeTags:
                  type: string
              required:
                - task
                - model
                - customMode
                - clipId
                - makeInstrumental
                - prompt
                - tags
                - title
                - vocalGender
                - styleWeight
                - weirdnessConstraint
                - audioWeight
                - negativeTags
              x-apifox-orders:
                - task
                - model
                - customMode
                - clipId
                - makeInstrumental
                - prompt
                - tags
                - title
                - vocalGender
                - styleWeight
                - weirdnessConstraint
                - audioWeight
                - negativeTags
            example:
              task: cover
              model: v45
              customMode: false
              clipId: 05d72140-38f5-4eb4-bdaa-a6e0d1c1167e
              makeInstrumental: false
              prompt: 变成女声，然后嗓音偏雷鬼一点
              tags: Hip-Hop/Rap, Happy, Party
              title: Roadtrip Sunrise10
              vocalGender: f
              styleWeight: 0.65
              weirdnessConstraint: 0.65
              audioWeight: 0.65
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403145814-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 上传并扩展音乐

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 上传并扩展音乐
      deprecated: false
      description: >-
        ## 使用指南

        - 此接口根据您的文本提示创建音乐

        - 每个请求会生成多个变体

        - 您可以通过自定义模式和纯音乐设置来控制细节级别


        ## 参数说明（task 为 upload_extend）

        - 模型（model）：
          - v40, v45, v45+, v45-lite, v50
        - 歌曲URL（audioUrl）：
          - 用户的mp3 URL（请确保可下载）
        - 续写开始时间（continueAt）
          - 定义从第几秒开始续写歌曲
        - 自定义模式下（customMode: true）:
          - makeInstrumental: true：需提供 style 和 title
          - makeInstrumental: false：需提供 style、prompt 和 title
          - 不同模型的字符限制：
            - V3_5 和 V4：prompt 3000字符，style 200字符
            - V4_5 和 V4_5PLUS：prompt 5000字符，style 1000字符
            - V50：prompt 5000字符，style 1000字符
          - title 长度限制：80字符（所有模型）
        - 非自定义模式下（customMode: false）:
          - 无论 makeInstrumental 设置如何，仅需提供 prompt
          - prompt 长度限制：400字符
          - 其他参数应留空
        ## 开发者注意事项

        - 新用户建议：以 custom_mode: false 开始使用，更简单

        - 回调过程分三个阶段：text（文本生成）、first（第一首完成）、complete（全部完成）

        ## 可选参数

        - vocalGender（string）: 人声性别偏好。m 男声，f 女声。

        - styleWeight（number）: 对风格的遵循强度。范围 0–1，保留两位小数。示例：0.65。

        - weirdnessConstraint（number）: 创意/离散程度。范围 0–1，保留两位小数。示例：0.65。

        - audioWeight（number）: 音频要素权重。范围 0–1，保留两位小数。示例：0.65。

        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                model:
                  type: string
                customMode:
                  type: boolean
                audioUrl:
                  type: string
                continueAt:
                  type: integer
                makeInstrumental:
                  type: boolean
                prompt:
                  type: string
                tags:
                  type: string
                negativeTags:
                  type: string
                title:
                  type: string
                styleWeight:
                  type: number
                weirdnessConstraint:
                  type: number
                audioWeight:
                  type: number
              required:
                - task
                - model
                - customMode
                - audioUrl
                - continueAt
                - makeInstrumental
                - prompt
                - tags
                - negativeTags
                - title
                - styleWeight
                - weirdnessConstraint
                - audioWeight
            example:
              task: upload_extend
              model: v45
              customMode: false
              audioUrl: https://cdn1.suno.ai/4f51f49d-8875-442d-9a66-81a7e66d55d6.mp3
              continueAt: 60
              makeInstrumental: false
              prompt: Upbeat EDM about sunrise and new beginnings.
              tags: Happy, Party
              negativeTags: Hip-Hop/Rap
              title: Roadtrip Sunrise2
              styleWeight: 0.65
              weirdnessConstraint: 0.65
              audioWeight: 0.65
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403145934-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 上传并翻唱音乐

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 上传并翻唱音乐
      deprecated: false
      description: >-
        ## 使用指南

        - 此接口根据您的文本提示创建音乐

        - 每个请求会生成多个变体

        - 您可以通过自定义模式和纯音乐设置来控制细节级别


        ## 参数说明（task 为 upload_cover）

        - 模型（model）：
          - v40, v45, v45+, v45-lite, v50
        - 歌曲URL（audioUrl）：
          - 用户的mp3 URL（请确保可下载）
        - 自定义模式下（customMode: true）:
          - makeInstrumental: true：需提供 style 和 title
          - makeInstrumental: false：需提供 style、prompt 和 title
          - 不同模型的字符限制：
            - V3_5 和 V4：prompt 3000字符，style 200字符
            - V4_5 和 V4_5PLUS：prompt 5000字符，style 1000字符
            - V50：prompt 5000字符，style 1000字符
          - title 长度限制：80字符（所有模型）
        - 非自定义模式下（customMode: false）:
          - 无论 makeInstrumental 设置如何，仅需提供 prompt
          - prompt 长度限制：400字符
          - 其他参数应留空
        ## 开发者注意事项

        - 新用户建议：以 custom_mode: false 开始使用，更简单

        - 回调过程分三个阶段：text（文本生成）、first（第一首完成）、complete（全部完成）

        ## 可选参数

        - vocalGender（string）: 人声性别偏好。m 男声，f 女声。

        - styleWeight（number）: 对风格的遵循强度。范围 0–1，保留两位小数。示例：0.65。

        - weirdnessConstraint（number）: 创意/离散程度。范围 0–1，保留两位小数。示例：0.65。

        - audioWeight（number）: 音频要素权重。范围 0–1，保留两位小数。示例：0.65。

        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                model:
                  type: string
                audioUrl:
                  type: string
                customMode:
                  type: boolean
                makeInstrumental:
                  type: boolean
                prompt:
                  type: string
                tags:
                  type: string
                title:
                  type: string
                vocalGender:
                  type: string
                styleWeight:
                  type: number
                weirdnessConstraint:
                  type: number
                audioWeight:
                  type: number
              required:
                - task
                - model
                - audioUrl
                - customMode
                - makeInstrumental
                - prompt
                - tags
                - title
                - vocalGender
                - styleWeight
                - weirdnessConstraint
                - audioWeight
            example:
              task: upload_cover
              model: v45
              audioUrl: https://cdn1.suno.ai/4f51f49d-8875-442d-9a66-81a7e66d55d6.mp3
              customMode: false
              makeInstrumental: false
              prompt: 变成女声，然后嗓音偏雷鬼一点
              tags: Hip-Hop/Rap, Happy, Party
              title: Roadtrip Sunrise10
              vocalGender: f
              styleWeight: 0.65
              weirdnessConstraint: 0.65
              audioWeight: 0.65
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403145869-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 修改音乐片段

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 修改音乐片段
      deprecated: false
      description: >-
        ## 使用说明

        - 此接口用于替换原歌曲中一些片段，输出结果为片段音频

        - 拿到片段音频后，需要调用replace_merge合并成完整的音乐


        ## 参数说明（task 为 replace_section）

        - 任务id（taskId）
          - 输入cqtai的任务id。
        - 音乐id（clipId）
          - 输入需要操作的音频id
        - 新的歌词（infillLyrics）
          - 需要重新演唱的歌词
        - 原歌曲的时间（rangeStartS - rangeEndS）
          - rangeStartS 原歌曲的开始时间
          - rangeEndS 原歌曲的结束时间
          
        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                taskId:
                  type: string
                clipId:
                  type: string
                tags:
                  type: string
                title:
                  type: string
                infillLyrics:
                  type: string
                rangeStartS:
                  type: number
                rangeEndS:
                  type: number
              required:
                - task
                - taskId
                - clipId
                - tags
                - title
                - infillLyrics
                - rangeStartS
                - rangeEndS
            example:
              task: replace_section
              taskId: d649231618784ee4b9cfa059ac50be5e
              clipId: eb1c6c96-a102-4bbb-82c2-87c3b126a44e
              tags: Happy
              title: 两只老虎(聪明)
              infillLyrics: >-
                两只老虎 两只老虎跑得快 跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪两只老虎 两只老虎跑得快
                跑得快一只没有耳朵一只没有尾巴真奇怪 真奇怪
              rangeStartS: 7.56
              rangeEndS: 15.98
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403145964-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 音乐片段合并

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 音乐片段合并
      deprecated: false
      description: >-
        ## 使用说明

        - 此接口用于将新生成的片段与原歌曲进行合并

        - !!!!需要先通过replace_section接口获取片段音频id!!!!


        ## 参数说明（task 为 replace_merge）

        - 音乐id（clipId）
          - 需要替换的音频片段,一般用create 接口中拿到的结果
        - 片段音乐ID（editSessionId）
          - 从replace_section接口中获取到的片段音频
          
        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
                editSessionId:
                  type: string
              required:
                - task
                - clipId
                - editSessionId
            example:
              task: replace_merge
              clipId: 214f6b75-81c9-46a4-9e68-2f8e496ce5c0
              editSessionId: 2d2991ed-401e-4926-9e7e-9963108e850c
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403146147-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 生成人声和伴奏

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 生成人声和伴奏
      deprecated: false
      description: >
        ## 使用说明

        - 获取人声和伴奏两个音轨


        ## 参数说明（task 为 gen_stem_two）

        - 音乐id（clipId）
          - 创建音乐接口返回的歌曲id
          
        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
              required:
                - task
                - clipId
            example:
              task: gen_stem_two
              clipId: 05d72140-38f5-4eb4-bdaa-a6e0d1c1167e
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403146178-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取乐器音轨（MIDI）

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取乐器音轨（MIDI）
      deprecated: false
      description: >-
        ## 使用说明

        - 获取所有乐器的音轨，包括但不限于（人声/钢琴/鼓点/贝斯）


        ## 参数说明（task 为 gen_stem_two）

        - 音乐id（clipId）
          - 创建音乐接口返回的歌曲id
          
        ## Authorizations

        获取 API Key:访问 [API Key 管理页面](https://www.cqtai.com/zh/secret-key) 获取您的
        API Key

        使用方式:

        在请求头中添加：

        Authorization: Bearer YOUR_API_KEY


        注意事项：


        请妥善保管您的 API Key，不要泄露给他人

        如果怀疑 API Key 泄露，请立即在管理页面重置
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
              required:
                - task
                - clipId
            example:
              task: gen_stem_all
              clipId: 05d72140-38f5-4eb4-bdaa-a6e0d1c1167e
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403146194-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取歌词

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取歌词
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                prompt:
                  type: string
              required:
                - task
                - prompt
            example:
              task: lyrics
              prompt: A happy song about a girl and a boy.
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403146574-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取歌曲MP4

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取歌曲MP4
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
              required:
                - task
                - clipId
            example:
              task: mp4
              clipId: e1a78bfe-2e53-4207-9cd8-c764c4bfc621
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403149601-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取歌曲WAV

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取歌曲WAV
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
              required:
                - task
                - clipId
            example:
              task: wav
              clipId: e1a78bfe-2e53-4207-9cd8-c764c4bfc621
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403151178-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取歌词/音频时间线

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取歌词/音频时间线
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
              required:
                - task
                - clipId
            example:
              task: timeline
              clipId: e1a78bfe-2e53-4207-9cd8-c764c4bfc621
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403151204-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取节拍

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取节拍
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                clipId:
                  type: string
              required:
                - task
                - clipId
            example:
              task: downbeats
              clipId: e1a78bfe-2e53-4207-9cd8-c764c4bfc621
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: string
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403151230-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 获取tags

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 获取tags
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                prompt:
                  type: string
              required:
                - task
                - prompt
            example:
              task: upsample_tags
              prompt: cpop
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403151251-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 创建角色

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/cqt/generator/suno:
    post:
      summary: 创建角色
      deprecated: false
      description: ''
      tags:
        - sunoV2
        - sunoV2
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                taskId:
                  type: string
                clipId:
                  type: string
                name:
                  type: string
                description:
                  type: string
              required:
                - task
                - taskId
                - clipId
                - name
                - description
            example:
              task: persona
              taskId: de6f28d589c6416f9baabd5d0b227f7f
              clipId: 2d2991ed-401e-4926-9e7e-9963108e850c
              name: 两只老虎
              description: 第一次生成的角色
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: sunoV2
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6819464/apis/api-403151260-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```