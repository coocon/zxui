/**
 * ZXUI (Zhixin UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 下拉选择菜单
 * @author chris(wfsr@foxmail.com)
 */
 
define(function (require) {

    var T = baidu;
    var Control = require('./Control');
    var Popup = require('./Popup');

    /**
     * 取字符字节长度
     * 
     * @param {string} str 目标字符
     * @return {number} 目标字符的字节长度
     */
    function bLength (str) {
        return str.replace(/[^\x00-\xff]/gi, '..').length;
    }

    /**
     * 文字溢出处理
     * 
     * @param {string} str 目标字符串
     * @param {number} max 截取的字节长度
     * @param {?string=} ellipsis 超长后的附加后缀
     * @return {string} 目标字符串被截取后加上后缀的字符串
     */
    function textOverflow(str, max, ellipsis){

        if (max >= bLength(str)) {
            return str;
        }
        
        var i = 0;
        var l = 0;
        var rs = '';
        while (l < max) {
            rs += str.charAt(i);
            l += bLength(str.charAt(i));
            i ++;
        }
    
        if (l > max) {
            rs = rs.substr(0, rs.length - 1);
        }
        
        var ellipsisLen = ellipsis ? bLength(ellipsis) : 0;
        if (ellipsisLen) {
            max -= ellipsisLen;
            rs = textOverflow(rs, max) + ellipsis;
        }
        
        return rs;
    }


    /**
     * 下拉选择菜单
     * 
     * @constructor
     * @extends module:Control
     * @requires Control
     * @exports Select
     * @example
     *  new Select({
     *     prefix: 'ecl-ui-sel',
     *     main: me.qq('ecl-ui-sel'),
     *     target: me.qq('ecl-ui-sel-holder'),
     *     offset: {
     *       y: -1
     *     },
     *     onChange: function (arg) {
     *       window.console && console.log(arg);
     *     }
     *   }).render();
     */
    var Select = function () {
        this.constructor.superClass.constructor.apply(this, arguments);
    };


    Select.prototype = {

        /**
         * 控件类型标识
         * 
         * @private
         * @type {string}
         */
        type: 'Select',

        /**
         * 控件配置项
         * 
         * @private
         * @name module:Select#options
         * @type {Object}
         * @property {boolean} options.disabled 控件的不可用状态
         * @property {(string | HTMLElement)} options.main 控件渲染容器
         * @property {number} options.maxLength 显示选中值时的限度字节长度
         * @property {string} options.ellipsis maxLength 限制后的附加的后缀字符
         * @property {(string | HTMLElement)} options.target 计算选单显示时
         * 相对位置的目标对象
         * @property {number} options.cols 选项显示的列数，默认为 1 列
         * @property {string} options.prefix 控件class前缀，同时将作为main的class之一
         */
        options: {

            // 提示框的不可用状态，默认为false。处于不可用状态的提示框不会出现。
            disabled: false,

            // 控件渲染主容器
            main: '',

            // 显示选中值时的限度字节长度
            maxLength: 16,

            // maxLength 限制后的附加的后缀字符
            ellipsis: '...',

            // 计算选单显示时相对位置的目标对象
            target: '',

            // 显示列数
            cols: 1,

            selectedClass: 'cur',

            // 控件class前缀，同时将作为main的class之一
            prefix: 'ecl-ui-sel'
        },

        /**
         * 需要绑定 this 的方法名，多个方法以半角逗号分开
         * 
         * @private
         * @type {string}
         */
        binds: 'onClick,onBeforeShow,onHide',

        /**
         * 控件初始化
         * 
         * @private
         * @param {Object} options 控件配置项
         * @see module:Select#options
         */
        init: function (options) {
            options = this.setOptions(options);

            if (!options.target) {
                throw new Error('invalid target');
            }

            this.disabled  = options.disabled;
        },


        /**
         * 绘制控件
         * 
         * @public
         * @return {module:Select} 当前实例
         */
        render: function () {
            var options = this.options;

            if (!this.rendered) {
                this.rendered = true;

                this.target = T.g(options.target);
                this.realTarget = T.dom.first(this.target);
                this.defaultValue = this.realTarget.innerHTML;
                this.srcOptions.triggers = [this.target];

                var popup = this.popup = new Popup(this.srcOptions);
                this.addChild(popup);

                popup.on('click', this.onClick);
                popup.on('beforeShow', this.onBeforeShow);
                popup.on('hide', this.onHide);

                popup.render();

                this.main = popup.main;

                if (options.cols > 1) {
                    T.addClass(
                        this.main,
                        options.prefix + '-cols' + options.cols
                    );
                    //T.addClass(this.main, 'c-clearfix');
                }
            }

            return this;
        },


        /**
         * 处理选单点击事件
         * 
         * @private
         * @param {Object} args 从 Popup 传来的事件对象
         */
        onClick: function (args) {
            var e = args.event;

            if (!e) {
                return;
            }

            var el     = T.event.getTarget(e);
            var tag    = el.tagName;

            switch (tag) {

                case 'A':
                    T.event.preventDefault(e);

                    this.pick(el);

                    break;

                default:

                    break;

            }

            this.fire('click', args);
        },

        /**
         * 转发Popup的onBeforeShow事件
         * 
         * @private
         * @param {Object} arg 事件参数
         * @fires module:Select#beforeShow
         */
        onBeforeShow: function (arg) {

            /**
             * @event module:Select#beforeShow
             * @type {Object}
             * @property {DOMEvent} event 事件源对象
             */
            this.fire('beforeShow', arg);

            T.addClass(this.target, this.options.prefix + '-hl');

            T.event.preventDefault(arg.event);
        },

        /**
         * 隐藏浮层后的处理，主要是为了去掉高亮样式
         * 
         * @private
         */
        onHide: function () {
            T.removeClass(this.target, this.options.prefix + '-hl');
        },


        /**
         * 显示浮层
         * 
         * @public
         * @param {?HTMLElement=} target 触发显示浮层的节点
         * @fires module:Select#show 显示事件
         */
        show: function (target) {

            this.popup.show();

            /**
             * @event module:Select#show
             * @type {object}
             * @property {?HTMLElement=} target 触发显示浮层的节点
             */
            this.fire('show', {target: target});

        },

        /**
         * 隐藏浮层
         * 
         * @public
         * @fires module:Select#hide 隐藏事件
         */
        hide: function () {
            
            this.popup.hide();

            /**
             * @event module:Select#hide
             */
            this.fire('hide');
        },

        /**
         * 选取选项
         * 
         * @private
         * @param {HTMLElement} el 点击的当前事件源对象
         * @param {boolean} isSilent 静默模式，是否发送事件通知
         * @fires module:Select#pick
         * @fires module:Select#change
         */
        pick: function (el, isSilent) {

            this.hide();

            var lastItem = this.lastItem;
            if (lastItem === el) {
                return;
            }

            var options = this.options;
            var target = this.target;
            var realTarget = this.realTarget;
            var lastValue = this.lastValue | 0;
            var selectedClass = options.prefix + '-' + options.selectedClass;

            var value  = el.getAttribute('data-value') | 0;
            var text = value ? el.innerHTML : this.defaultValue;
            var shortText = value
                ? textOverflow(text, options.maxLength, options.ellipsis)
                : text;

            if (lastItem) {
                T.removeClass(lastItem, selectedClass);
            }

            if (value) {
                T.addClass(el, selectedClass);
            }

            this.lastItem = el;

            if (!isSilent) {

                /**
                 * @event module:Select#pick
                 * @type {Object}
                 * @property {string} value 选中项的值
                 * @property {string} text 选中项的文字
                 * @property {Date} shortText 选中项的文字的切割值
                 */
                this.fire('pick', { 
                    value: value,
                    text: text,
                    shortText: shortText
                });

            }

            if (value === lastValue) {              
                return;
            }

            this.lastValue = value;

            if (target) {

                if (target.type) {
                    target.value = shortText;
                    target.focus();
                }
                else {
                    (realTarget || target).innerHTML = shortText;
                }

                target.title = text;
            }

            var klass = options.prefix + '-checked';
            T[value ? 'addClass' : 'removeClass'](target, klass);

            if (!isSilent) {

                /**
                 * @event module:Select#change
                 * @type {Object}
                 * @property {string} value 选中项的值
                 * @property {string} text 选中项的文字
                 * @property {Date} shortText 选中项的文字的切割值
                 */
                this.fire('change', { 
                    value: value,
                    text: text,
                    shortText: shortText
                });           
            }

        },

        /**
         * 重置选项
         * 
         * 将选项恢复到初始值，依赖于第一个选项，其值为 0 或空
         */
        reset: function () {
            this.pick(T.dom.first(this.main), true);
        }
    };
    T.inherits(Select, Control);

    return Select;
});
