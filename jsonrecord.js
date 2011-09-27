//    JsonRecord.js

(function () {
  var JsonRecord = this.JsonRecord = {};

  /**
   * モデルのコンストラクタ
   *
   * @param {Object} 保存するデータ
   */

  JsonRecord.Model = function (properties) {
    //console.log(properties);
    this.properties = properties;
  };

  _.extend(JsonRecord.Model, {

    /**
     * モデルを定義する
     *
     * @param {String} ドキュメント名
     * @param {Object} ドキュメントのスキーマ
     * @return {JsonRecord.Model}
     * @api public
     */

    define: function (name, schema) {
      var self = this
        , child = function () { return self.apply(this, arguments); }
        , ctor = function () {};
      _.extend(child, self);
      ctor.prototype = self.prototype;
      child.prototype = new ctor();
      child.prototype.constructor = child;
      child.prototype.name = name;
      child.prototype.schema = schema;
      return child;
    },

    /**
     * 降順に並び替える
     *
     * @param {String} 並び替えの基準となるプロパティの名前
     * @return {Query}
     * @api public
     */

    desc: function (name) {
      return this._newQuery().desc(name);
    },

    eq: function (condition) {
      console.log('Model.eq called');
      return this._newQuery().eq(condition);
    },

    ge: function (condition) {
      return this._newQuery().ge(condition);
    },

    limit: function (condition) {
      console.log('Model.limit called');
      return this._newQuery().limit(condition);
    },

    get: function (callback) {
      this._newQuery().get(callback);
    },

    /**
     * ドキュメントの更新
     *
     * Example:
     *  MyModel.update(docId, { body: newBody }, function (err) {
     *    if (err) {
     *      // ドキュメントの更新に失敗
     *    } else {
     *      // ドキュメントの更新に成功
     *    }
     *  });
     *
     * @param {String} ドキュメントのID
     * @param {Object} 更新するデータ
     * @param {Function} コールバック関数
     * @api public
     */

    update: function (docId, data, callback) {
      console.log('JsonRecord.Model.update called');
      //console.log('docType: ' + this.prototype.name);
      $.ajax({
          type: 'PUT'
        , url: '/_je/' + this.prototype.name
        , data: _.extend(data, { _docId: docId })
        , success: function () {
            callback(false);
        }
        , error: function (err) {
            callback(err.statusText);
        }
      });
    },

    remove: function (callback) {
      this._newQuery().remove(callback);
    },

    _newQuery: function () {
      return new JsonRecord.Query(this.prototype.name);
    }
  });

  _.extend(JsonRecord.Model.prototype, {

    /**
     * ドキュメントを保存する
     *
     * @param {Function} コールバック関数
     * @api public
     */

    save: function (callback) {
      var self = this
        , data = {};

      _.each(self.schema, function (num, key) {
        data[key] = self.properties[key];
      });

      $.ajax({
        type: 'POST',
        url: '/_je/' + self.name,
        data: (data),
        success: function (data) {
          callback(data);
        }
      });
    },

    /**
     * バリデーション
     *
     * @return {Boolean}
     * @api public
     */

    isValid: function () {
      //console.log('isValid() called');
      var properties = this.properties
        , schema = this.schema
        , errors = [];

      for (var property in properties) {
        var value = properties[property]
          , options = schema[property];

        for (var option in options) {
          var optionValue = options[option];

          if (option === 'length' && value.length > optionValue) {
            errors.push(property + ' length > ' + optionValue);
          }
          if (option === 'required' && optionValue && _.isEmpty(value)) {
            errors.push(property + 'は必須項目です');
          }
          if (option === 'type') {
            //console.log(optionValue);
            if (optionValue === JsonRecord.Types.Email) {
              //console.log(JsonRecord.Types.Email.regex);
              if (!value.match(JsonRecord.Types.Email.regex)) {
                errors.push(property + 'はEmailの形式ではありません');
              }
            }
            if (optionValue === Number && _.isNumber(value) === false) {
              errors.push(property + 'は数値ではありません');
            }
            if (optionValue === String && _.isString(value) === false) {
              errors.push(property + 'は文字列ではありません');
            }
          }
        }
      }
      if (_.isEmpty(errors)) return true;
      this.errors = errors;
      return false;
    }
  });


  // conditionStringをインスタンスごとに記録したかったから
  // Modelとは別にQueryというコンストラクタを用意した。
  JsonRecord.Query = function (modelName) {
    this.conditionsString = '';
    this.modelName = modelName;
  };

  _.extend(JsonRecord.Query.prototype, {
    desc: function (name) {
      var separator = this._prepareSeparator();

      this.conditionsString = this.conditionsString + separator + 'sort=' + name + '.desc';

      return this;
    },

    eq: function (condition) {
      console.log('Query.prototype.eq called');
      var key = _.keys(condition)[0]
        , value = condition[key]
        , separator = this._prepareSeparator();
      
      if (key === '_docId') {
        this.conditionsString = '/' + value;
      } else {
        this.conditionsString = this.conditionsString + separator + 'cond=' + key + '.eq.' + value;
      }

      return this;
    },

    ge: function (condition) {
      var key = _.keys(condition)[0]
        , value = condition[key]
        , separator = this._prepareSeparator();

      this.conditionsString = this.conditionsString + separator + 'cond=' + key + '.ge.' + value;

      return this;
    },

    limit: function (condition) {
      console.log('Query.prototype.limit called');
      var separator = this._prepareSeparator();

      this.conditionsString = this.conditionsString + separator + 'limit=' + condition;

      return this;
    },

    get: function (callback) {
      return $.ajax({
        url: '/_je/' + this.modelName + this.conditionsString,
        success: function (data) {
          callback(data);
        }
      });
    },

    remove: function (callback) {
      var self = this;
      console.log(self.conditionsString);
      self.get(function (data) {
        var ajax = function (doc) {
          $.ajax({
            url: '/_je/' + self.modelName + '/' + doc._docId,
            type: 'DELETE',
            success: function (data) {
              callback(data);
            }
          });
        }
        if (_.isArray(data)) {
          _.each(data, function (doc) {
            ajax(doc);
          });
        } else {
          ajax(data);
        }
        //console.log(data);
      });
    },

    _prepareSeparator: function () {
      return (this.conditionsString === '') ? '?' : '&';
    }
  });
  

  JsonRecord.Types = function () {};

  JsonRecord.Types.Email = function () {};
  _.extend(JsonRecord.Types.Email, {
    regex: /^[a-z0-9!#\$%&'\*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#\$%&'\*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
  });
})();
