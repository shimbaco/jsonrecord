module('JsonRecord.Query', {
  setup: function () {
    var self = this;

    self.params = null;
    self.originalAjax = $.ajax;
    
    // $.ajax()メソッドに渡したデータをテストコードから参照できるように上書きする
    $.ajax = function (params) {
      self.params = params;

      return self.originalAjax(params);
    };
  }
});


test('.get', function () {
  var self = this;
  var Post = JsonRecord.Model.define('test_posts', {
    body: { type: String }
  });

  stop();
  Post.get(function (posts) {
    equals(self.params.url, '/_je/test_posts');

    Post.eq({ body: 'foo' }).get(function (posts) {
      equals(self.params.url, '/_je/test_posts?cond=body.eq.foo');

      Post.ge({ body: 1 }).get(function (posts) {
        equals(self.params.url, '/_je/test_posts?cond=body.ge.1');

        Post.limit(2).get(function (posts) {
          equals(self.params.url, '/_je/test_posts?limit=2');

          Post.desc('body').get(function (posts) {
            equals(self.params.url, '/_je/test_posts?sort=body.desc');
            
            Post.desc('body').limit(3).get(function (posts) {
              equals(self.params.url, '/_je/test_posts?sort=body.desc&limit=3');
              start();
            });
          });
        });
      });
    });
  });
});


test('#isValid', function () {
  var Post = JsonRecord.Model.define('test_posts', {
    body1: { type: String, required: true },
    body2: { type: String, length: 3 },
    email: { type: JsonRecord.Types.Email },
    num: { type: Number }
  });

  var post1 = new Post({
    body1: 'hoge',
    body2: 'foo'
  });
  equal(post1.isValid(), true);

  var post2 = new Post({
    body1: '',
    body2: 'foo'
  });
  equal(post2.isValid(), false);

  var post3 = new Post({
    body1: 'hoge',
    body2: 'too loooooonnng!!!!!!!!!'
  });
  equal(post3.isValid(), false);

  var post4 = new Post({
    body1: 1,
    body2: 'foo'
  });
  equal(post4.isValid(), false);

  var post5 = new Post({
    body: 'hoge',
    email: 'hoge@example.com'
  });
  equal(post5.isValid(), true);

  var post6 = new Post({
    body: 'hoge',
    email: 'hoge@examplecom'
  });
  equal(post6.isValid(), false);

  var post7 = new Post({
    body: 'hoge',
    num: 100
  });
  equal(post7.isValid(), true);

  var post8 = new Post({
    body: 'hoge',
    num: '100'
  });
  equal(post8.isValid(), false);
});


test('#save', function () {
  var self = this;
  var Post = JsonRecord.Model.define('test_posts', {
    body: { type: String }
  });
  var post = new Post({ body: 'hoge' });

  stop();
  post.save(function (data) {
    equals(self.params.type, 'POST');
    equals(self.params.url, '/_je/test_posts');
    equals(self.params.data['body'], 'hoge');
    start();
  });
});
