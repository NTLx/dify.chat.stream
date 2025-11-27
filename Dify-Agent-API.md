# Dify API Documentation / Dify API 文档

**Base URL**: `https://difyapi-v1-oe.cloud.cubicise.com:50505/v1`
**App ID**: `15a6744b-3c7c-40b0-85f4-9c7b388548e2`

## Authentication / 认证

All API requests require a Bearer Token in the Authorization header.
所有 API 请求都需要在 Authorization header 中包含 Bearer Token。

```bash
Authorization: Bearer {api_key}
```

---

## 1. Send Chat Message / 发送对话消息

`POST /chat-messages`

Send a request to the chat application.
向对话应用发送请求。

### Request Body / 请求体

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `inputs` | `object` | (Optional) User input form parameters. | (选填) 用户输入表单参数。 |
| `query` | `string` | User input/question content. | 用户输入/提问内容。 |
| `response_mode` | `string` | `streaming` (streaming) or `blocking` (blocking). Default is `blocking`. | `streaming` (流式) 或 `blocking` (阻塞)。默认为 `blocking`。 |
| `user` | `string` | User identifier, defined by the developer. Must be unique within the app. | 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。 |
| `conversation_id` | `string` | (Optional) Conversation ID. Leave empty for new conversation; pass ID to continue. | (选填) 会话 ID。为空则新建会话；传入 ID 则继续对话。 |
| `files` | `array[object]` | (Optional) File list. | (选填) 文件列表。 |
| `auto_generate_name` | `bool` | (Optional) Auto-generate title. Default `true`. | (选填) 自动生成标题，默认 `true`。 |

### Response / 响应

#### Blocking Mode / 阻塞模式

```json
{
  "event": "message",
  "message_id": "5ad4cb98-f0c7-4085-b384-88c403be6290",
  "conversation_id": "450aa74d-1495-4696-b039-4656258c3d8f",
  "mode": "chat",
  "answer": "Hello Dify",
  "metadata": {
    "usage": {
      "prompt_tokens": 1033,
      "completion_tokens": 135,
      "total_tokens": 1168,
      "estimated_price": "0.00060935"
    },
    "retriever_resources": [
      {
        "position": 1,
        "dataset_id": "101b4c97-fc2e-463c-90b1-5261a4cdcafb",
        "dataset_name": "iPhone",
        "document_id": "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00",
        "document_name": "iPhone List",
        "segment_id": "ed599c7f-2766-4294-9d1d-e5235a61270a",
        "score": 0.98457545,
        "content": "..."
      }
    ]
  },
  "created_at": 1705407629
}
```

#### Streaming Mode / 流式模式

Returns a stream of chunks. / 返回分块流。

- `message`: Message content chunk. / 消息内容分块。
- `agent_message`: Agent thought/process. / Agent 思考/过程。
- `agent_thought`: Agent thought content. / Agent 思考内容。
- `message_file`: Message file. / 消息文件。
- `message_end`: Message end. / 消息结束。
- `tts_message`: TTS audio stream. / TTS 音频流。
- `message_replace`: Message replacement. / 消息替换。
- `error`: Error occurred. / 发生错误。
- `ping`: Keep-alive. / 心跳。

---

## 2. Upload File / 上传文件

`POST /files/upload`

Upload a file (image/document) for use in messages.
上传文件（图片/文档）以在消息中使用。

### Request Body / 请求体

`multipart/form-data`

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `file` | `file` | The file to upload. | 要上传的文件。 |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

```json
{
  "id": "72fa9618-8f89-4a37-9b33-7e1178a24a67",
  "name": "example.png",
  "size": 1024,
  "extension": "png",
  "mime_type": "image/png",
  "created_by": 123,
  "created_at": 1577836800
}
```

---

## 3. Stop Response / 停止响应

`POST /chat-messages/:task_id/stop`

Stop a streaming response.
停止流式响应。

### Path Parameters / 路径参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `task_id` | `string` | Task ID (from streaming response). | 任务 ID (来自流式响应)。 |

### Request Body / 请求体

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

```json
{
  "result": "success"
}
```

---

## 4. Message Feedback / 消息反馈

`POST /messages/:message_id/feedbacks`

Like or dislike a message.
点赞或点踩消息。

### Path Parameters / 路径参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `message_id` | `string` | Message ID. | 消息 ID。 |

### Request Body / 请求体

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `rating` | `string` | `like`, `dislike`, or `null` (undo). | `like` (点赞), `dislike` (点踩), 或 `null` (撤销)。 |
| `user` | `string` | User identifier. | 用户标识。 |
| `content` | `string` | (Optional) Feedback content. | (选填) 反馈具体信息。 |

### Response / 响应

```json
{
  "result": "success"
}
```

---

## 5. Get Next Suggested Questions / 获取下一轮建议问题

`GET /messages/:message_id/suggested`

Get suggested questions for the next turn.
获取下一轮建议问题列表。

### Path Parameters / 路径参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `message_id` | `string` | Message ID. | 消息 ID。 |

### Query Parameters / 查询参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

```json
{
  "result": "success",
  "data": [
    "Question 1",
    "Question 2"
  ]
}
```

---

## 6. Get Conversation History / 获取会话历史消息

`GET /messages`

Get history messages in reverse order.
滚动加载形式返回历史聊天记录（倒序）。

### Query Parameters / 查询参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `conversation_id` | `string` | Conversation ID. | 会话 ID。 |
| `user` | `string` | User identifier. | 用户标识。 |
| `first_id` | `string` | (Optional) ID of the first record on the current page. | (选填) 当前页第一条记录的 ID。 |
| `limit` | `int` | (Optional) Limit per request. Default 20. | (选填) 每次请求返回条数。默认 20。 |

### Response / 响应

Returns a list of messages.
返回消息列表。

---

## 7. Get Conversation List / 获取会话列表

`GET /conversations`

Get the list of conversations for a user.
获取当前用户的会话列表。

### Query Parameters / 查询参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `user` | `string` | User identifier. | 用户标识。 |
| `last_id` | `string` | (Optional) ID of the last record on the current page. | (选填) 当前页最后一条记录的 ID。 |
| `limit` | `int` | (Optional) Limit per request. Default 20. | (选填) 每次请求返回条数。默认 20。 |
| `sort_by` | `string` | (Optional) Sort field. Default `-updated_at`. | (选填) 排序字段。默认 `-updated_at`。 |

### Response / 响应

Returns a list of conversations.
返回会话列表。

---

## 8. Delete Conversation / 删除会话

`DELETE /conversations/:conversation_id`

Delete a conversation.
删除会话。

### Path Parameters / 路径参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `conversation_id` | `string` | Conversation ID. | 会话 ID。 |

### Request Body / 请求体

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

```json
{
  "result": "success"
}
```

---

## 9. Rename Conversation / 会话重命名

`POST /conversations/:conversation_id/name`

Rename a conversation.
对会话进行重命名。

### Path Parameters / 路径参数

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `conversation_id` | `string` | Conversation ID. | 会话 ID。 |

### Request Body / 请求体

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | (Optional) New name. | (选填) 新名称。 |
| `auto_generate` | `bool` | (Optional) Auto-generate name. Default `false`. | (选填) 自动生成。默认 `false`。 |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

Returns updated conversation info.
返回更新后的会话信息。

---

## 10. Conversation Variables / 对话变量

### Get Variables / 获取变量

`GET /conversations/:conversation_id/variables`

### Update Variable / 更新变量

`PUT /conversations/:conversation_id/variables/:variable_id`

---

## 11. Audio to Text / 语音转文字

`POST /audio-to-text`

Convert audio file to text.
语音转文字。

### Request Body / 请求体

`multipart/form-data`

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `file` | `file` | Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm). Max 15MB. | 语音文件。最大 15MB。 |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

```json
{
  "text": "hello"
}
```

---

## 12. Text to Audio / 文字转语音

`POST /text-to-audio`

Convert text to audio.
文字转语音。

### Request Body / 请求体

| Field | Type | Description | 描述 |
| :--- | :--- | :--- | :--- |
| `message_id` | `string` | (Optional) Message ID to use generated text. | (选填) 使用 Dify 生成的消息 ID。 |
| `text` | `string` | (Optional) Text content. | (选填) 文本内容。 |
| `user` | `string` | User identifier. | 用户标识。 |

### Response / 响应

Audio file content.
音频文件内容。

---

## 13. App Info / 获取应用基本信息

`GET /info`

Get basic app information.
获取应用基本信息。

### Response / 响应

```json
{
  "name": "My App",
  "description": "This is my app.",
  "tags": ["tag1", "tag2"],
  "mode": "chat",
  "author_name": "Dify"
}
```

---

## 14. App Parameters / 获取应用参数

`GET /parameters`

Get app parameters (inputs, file settings, etc.).
获取应用参数（输入、文件设置等）。

### Response / 响应

Returns configuration for user inputs, file uploads, system parameters, etc.
返回用户输入、文件上传、系统参数等配置。

---

## 15. App Meta / 获取应用 Meta 信息

`GET /meta`

Get app meta information (icons).
获取应用 Meta 信息（图标）。

### Response / 响应

```json
{
  "tool_icons": { ... }
}
```
