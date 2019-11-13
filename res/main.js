$(document).ready(function () {
    var logos = {
        'igromania': 'igromania.svg',
        'dtf': 'dtf.png',
        'stopgame': 'stopgame.png',
        'kanobu': 'kanobu.png',
        'lki': 'lki.gif',
        'bestgamer': 'bestgamer.ico',
        'zog': 'zog.jpg'
    };

    var fancy_names = {
        'igromania': 'Игромания',
        'dtf': 'DTF',
        'stopgame': 'Stopgame.ru',
        'kanobu': 'Канобу',
        'lki': 'ЛКИ',
        'bestgamer': 'BestGamer.ru',
        'zog': 'Zone of Games'
    };

    var records = [];
    var loaded_event = new CustomEvent('records.loaded', {
        bubbles: true
    });

    function compile_all() {
        var data_files = [
            'dtf_main',
            'igromania_main',
            'igromania_raul',
            'stopgame_main',
            'stopgame_stream',
            'kanobu',
            'lki',
            'bestgamer',
            'zog'
        ];
        var needed = data_files.length;
        var finished = 0;
        for (let i in data_files) {
            $.getJSON('./data/' + data_files[i] + '.json', function (json) {
                records = records.concat(json);
                ++finished;
                if (finished === needed) {
                    document.dispatchEvent(loaded_event)
                }
            })
        }
    }

    var base_card = `
                <div class="card memorial-card" data-year="{year}" data-what="{where}">
                    {logo}
                    {img}
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">{title}</h5>
                        <p class="card-text">{teaser_text}</p>

                        <div class="bottomstuff">{url} <span class="date">{date}</span></div>
                    </div>
                </div>`;
    var card_image = '<img src="{img}" class="card-img-top"/>';
    var card_url = '<a href="{url}" class="btn btn-primary">Перейти к материалу</a>';
    var card_logo = '<img class="logo" src="{logo}">';

    function* iterate(_records) {
        for (let i in _records) {
            yield _records[i]
        }
    }

    document.addEventListener('records.loaded', function () {
        records = records.sort(function (a, b) {
            let amonth;
            let bmonth;
            let aday;
            let bday;
            a = a.date;
            b = b.date;
            if ((a.month + '').length === 1) {
                amonth = '0' + a.month
            } else {
                amonth = a.month
            }
            if ((b.month + '').length === 1) {
                bmonth = '0' + b.month
            } else {
                bmonth = b.month
            }
            if ((a.day + '').length === 1) {
                aday = '0' + a.day
            } else {
                aday = a.day
            }
            if ((b.day + '').length === 1) {
                bday = '0' + b.day
            } else {
                bday = b.day
            }
            if (Number(a.year + '' + amonth + '' + aday) > Number(b.year + '' + bmonth + '' + bday)) {
                return -1
            }
            if (Number(a.year + '' + amonth + '' + aday) < Number(b.year + '' + bmonth + '' + bday)) {
                return 1
            }
            return 0

        });

        draw(records);

        var years = {};
        var sources = {};

        for (let i in records) {
            let record = records[i];
            if (!years[record.date.year]) {
                years[record.date.year] = 0
            }
            ++years[record.date.year]
        }

        for (let i in records) {
            let record = records[i];
            if (!sources[record.where]) {
                sources[record.where] = 0
            }
            ++sources[record.where]
        }

        $.each(years, function (year, count) {
            $('#filters_year').prepend('<a class="dropdown-item" data-year="' + year + '" href="#">' + year + ' (' + count + ')</a>')
        });
        $.each(sources, function (source, count) {
            $('#filters_where').prepend('<a class="dropdown-item" data-where="' + source + '" href="#">' + fancy_names[source] + ' (' + count + ')</a>')
        })
    });

    function draw_card(record) {
        let card = base_card
            .replace('{title}', record.title)
            .replace('{teaser_text}', record.teaser_text)
            .replace('{date}', record.date.year + '.' + record.date.month + '.' + record.date.day)
            .replace('{year}', record.date.year)
            .replace('{where}', record.where);
        if (record.url) {
            card = card.replace('{url}', card_url.replace('{url}', record.url))
        } else {
            card = card.replace('{url}', '')
        }

        if (record.img) {
            card = card.replace('{img}', card_image.replace('{img}', record.img))
        } else {
            card = card.replace('{img}', '')
        }

        if (logos[record.where]) {
            card = card.replace('{logo}', card_logo.replace('{logo}', './res/image/' + logos[record.where]))
        } else {
            card = card.replace('{logo}', '')
        }

        $('#records_container').append(card)
    }

    compile_all();

    $('body').on('click', '#filters_year [data-year]', function () {
        $('.memorial-card').remove();
        draw(filter({'year': Number($(this).attr('data-year'))}))
    });
    $('body').on('click', '#filters_where [data-where]', function () {
        $('.memorial-card').remove();
        draw(filter({'where': $(this).attr('data-where')}))
    });

    function filter(filters) {
        var year;
        if (filters['year'] !== undefined) {
            year = filters['year']
        }

        var where;
        if (filters['where'] !== undefined) {
            where = filters['where']
        }
        var _records = records.filter(function (record) {
            if (year !== undefined && where !== undefined) {
                return record.date.year === year && record.where === where
            } else if (year !== undefined) {
                return record.date.year === year
            } else if (where !== undefined) {
                return record.where === where
            } else {
                return true
            }
        });

        return _records
    }

    function draw_nourl() {
        $('.memorial-card').remove();
        draw(records.filter(function (record) {
            return !record.url
        }))

    }

    function draw(_records) {
        let iterator = iterate(_records);
        let interval = setInterval(function () {
            let iteritem = iterator.next();
            if (iteritem.done) {
                clearInterval(interval)
            } else {
                draw_card(iteritem.value)
            }
        }, 1)
    }

    $('#unfilter_year').on('click', function () {
        draw(records)
    });

    $('#unfilter_where').on('click', function () {
        draw(records)
    })
});

// Hack :(
window.scrollTo(0, 0);
