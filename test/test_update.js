'use strict';

var expect				= require('expect.js');
var update				= require('../lib/update');
var dbTranslateWordsV1	= require('./files/casefile/translate_words_db/translate_words_db_v1');
var dbTranslateWordsV2	= require('./files/casefile/translate_words_db/translate_words_db_v2');
var dbTranslateWordsV3	= require('./files/casefile/translate_words_db/translate_words_db_v3');

describe('#update', function()
{
	it('#v1', function()
	{
		expect(update(dbTranslateWordsV1)).to.eql(dbTranslateWordsV2);
	});

	it('#v3', function()
	{
		expect(update(dbTranslateWordsV3)).to.eql(dbTranslateWordsV2);
	});
});
