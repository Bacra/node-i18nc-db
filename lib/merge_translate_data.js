/**
 * 将db数据和函数解析出来的结果进行合并
 * 得到最后落地到I18N函数中的翻译结果
 */

'use strict';

var _		= require('lodash');
var debug	= require('debug')('i18nc-db:merge_translate_data');


exports = module.exports = mergeTranslateData;

function mergeTranslateData(mainData)
{
	var json = _mergeData(mainData);
	return _toTranslateJSON(json);
}


exports._mergeData = _mergeData;
/**
 * 合并各个来源的数据
 * 根据参数来确定打包到code的数据
 *
 * input: test/files/merge_translate_data.js
 * output: test/files/output/merge_translate_data/merge_data.json
 */
function _mergeData(mainData)
{
	// 先用一个不规范的数据保存，最后要把语言作为一级key处理
	var result = {DEFAULTS: {}, SUBTYPES: {}};
	var codeTranslateWords = mainData.codeTranslateWords || {};
	var FILE_KEY = mainData.FILE_KEY;
	var dbTranslateWords = mainData.dbTranslateWords && mainData.dbTranslateWords.data || {};
	var typeData =
	{
		func		: mainData.funcTranslateWords,
		db_filekey	: dbTranslateWords[FILE_KEY],
		'db_*'		: dbTranslateWords['*'],
	};
	var onlyTheseLanguages = mainData.onlyTheseLanguages
			&& mainData.onlyTheseLanguages.length
			&& mainData.onlyTheseLanguages;
	debug('onlyTheseLanguages:%o', onlyTheseLanguages);

	_.each(_.uniq(codeTranslateWords.DEFAULTS), function(word)
	{
		var info = _getOneTypeListData('DEFAULTS', word, typeData, onlyTheseLanguages);
		result.DEFAULTS[word] = info.result;
	});

	_.each(codeTranslateWords.SUBTYPES, function(words, subtype)
	{
		var subresult = result.SUBTYPES[subtype] = {};
		_.each(_.uniq(words), function(word)
		{
			var info = _getOneTypeListData('SUBTYPES', word, typeData, onlyTheseLanguages, subtype);
			subresult[word] = info.result;
		});
	});

	return result;
}

/**
 * 针对单个type(DEFAULTS/SUBTYPES)，单个单词的 所有语言
 * 返回其翻译结果的数组
 *
 * 处理任务
 *     db下所有文件和指定文件的两份数据融合
 *     和函数中分析出来的数据融合
 */
function _getOneTypeListData(maintype, word, typeData, onlyTheseLanguages, subtype)
{
	var lans = {};
	var results = {};
	// 数组有先后顺序，不要随便调整
	var types = ['db_filekey', 'db_*', 'func'];

	types.forEach(function(type)
	{
		var result = results[type] = {};
		_.each(typeData[type], function(lanInfo, lan)
		{
			if (!lanInfo) return;
			if (onlyTheseLanguages && onlyTheseLanguages.indexOf(lan) == -1) return;

			var subLanInfo = lanInfo[maintype];
			if (subtype && subLanInfo) subLanInfo = subLanInfo[subtype];
			var translateWord = subLanInfo && subLanInfo[word];

			if (translateWord || translateWord === '')
			{
				lans[lan] = 1;
				result[lan] = translateWord;
			}
		});
	});


	var lans = Object.keys(lans);
	debug('word:%s, subtype:%s lans:%o, results:%o', word, subtype, lans, results);

	// 对获取到的所有数据进行合并操作
	var result = {};
	lans.forEach(function(lan)
	{
		types.some(function(type)
		{
			var tmp = results[type][lan];
			if (tmp || tmp === '')
			{
				result[lan] = tmp;
				return true;
			}
		});
	});

	return {
		lans: lans,
		result: result,
	};
}


function _toTranslateJSON(data)
{
	var result = {};
	_.each(data.DEFAULTS, function(lanData, word)
	{
		_.each(lanData, function(translateData, lan)
		{
			var lanObj = result[lan] || (result[lan] = {});
			var wordObj = lanObj.DEFAULTS || (lanObj.DEFAULTS = {});

			wordObj[word] = translateData;
		});
	});

	_.each(data.SUBTYPES, function(item, subtype)
	{
		_.each(item, function(lanData, word)
		{
			_.each(lanData, function(translateData, lan)
			{
				var lanObj = result[lan] || (result[lan] = {});
				var subtypeObj = lanObj.SUBTYPES || (lanObj.SUBTYPES = {});
				var wordObj = subtypeObj[subtype] || (subtypeObj[subtype] = {});

				wordObj[word] = translateData;
			});
		});
	});

	return result;
}
