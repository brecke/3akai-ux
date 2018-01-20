/*
 * Globalize Culture nn-NO
 *
 * http://github.com/jquery/globalize
 *
 * Copyright Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * This file was generated by the Globalize Culture Generator
 * Translation: bugs found in this file need to be fixed in the generator
 */

(function(window, undefined) {
    var Globalize;

    if (
        typeof require !== 'undefined' &&
        typeof exports !== 'undefined' &&
        typeof module !== 'undefined'
    ) {
        // Assume CommonJS
        Globalize = require('globalize');
    } else {
        // Global variable
        Globalize = window.Globalize;
    }

    Globalize.addCultureInfo('nn-NO', 'default', {
        name: 'nn-NO',
        englishName: 'Norwegian, Nynorsk (Norway)',
        nativeName: 'norsk, nynorsk (Noreg)',
        language: 'nn',
        numberFormat: {
            ',': ' ',
            '.': ',',
            negativeInfinity: '-INF',
            positiveInfinity: 'INF',
            percent: {
                ',': ' ',
                '.': ',',
            },
            currency: {
                pattern: ['$ -n', '$ n'],
                ',': ' ',
                '.': ',',
                symbol: 'kr',
            },
        },
        calendars: {
            standard: {
                '/': '.',
                firstDay: 1,
                days: {
                    names: [
                        'søndag',
                        'måndag',
                        'tysdag',
                        'onsdag',
                        'torsdag',
                        'fredag',
                        'laurdag',
                    ],
                    namesAbbr: ['sø', 'må', 'ty', 'on', 'to', 'fr', 'la'],
                    namesShort: ['sø', 'må', 'ty', 'on', 'to', 'fr', 'la'],
                },
                months: {
                    names: [
                        'januar',
                        'februar',
                        'mars',
                        'april',
                        'mai',
                        'juni',
                        'juli',
                        'august',
                        'september',
                        'oktober',
                        'november',
                        'desember',
                        '',
                    ],
                    namesAbbr: [
                        'jan',
                        'feb',
                        'mar',
                        'apr',
                        'mai',
                        'jun',
                        'jul',
                        'aug',
                        'sep',
                        'okt',
                        'nov',
                        'des',
                        '',
                    ],
                },
                AM: null,
                PM: null,
                patterns: {
                    d: 'dd.MM.yyyy',
                    D: 'd. MMMM yyyy',
                    t: 'HH:mm',
                    T: 'HH:mm:ss',
                    f: 'd. MMMM yyyy HH:mm',
                    F: 'd. MMMM yyyy HH:mm:ss',
                    M: 'd. MMMM',
                    Y: 'MMMM yyyy',
                },
            },
        },
    });
})(this);
