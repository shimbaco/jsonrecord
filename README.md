JsonRecord.js
=============================

[jsonengine](http://code.google.com/p/jsonengine/)のREST APIをORMっぽく使えるようにするライブラリです。

セットアップ
-------------------

```html
<script src="jquery.min.js"></script>
<script src="underscore-min.js"></script>
<script src="jsonrecord.js"></script>
```

例
-------

```javascript
// スキーマの定義
Task = JsonRecord.Model.define('tasks', {
    body: { type: String, required: true, length: 30 }
  , priority: { type: Number }
});

// インスタンスの作成
var task = new Task({
    body: '牛乳を買う'
  , priority: 3
});

// 保存
task.save(function (data) {
  console.log('保存しました');
});

// 取得
Task.eq({ priority: 3 }).get(function (docs) {});

// 削除
Task.eq({ _docId: '2WngPsQfbAyZ06KKWYSw7R3xrlcSiZE7' }).remove(function () {});
```

TODO
-------
