if (self.document && !("insertAdjacentHTML" in document.createElementNS("http://www.w3.org/1999/xhtml", "_"))) {
    HTMLElement.prototype.insertAdjacentHTML = function (position, html) {
        "use strict";

        let ref = this,
            container = ref.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "_"),
            ref_parent = ref.parentNode,
            node, first_child, next_sibling;

        container.innerHTML = html;

        switch (position.toLowerCase()) {
            case "beforebegin":
                while ((node = container.firstChild)) {
                    ref_parent.insertBefore(node, ref);
                }
                break;
            case "afterbegin":
                first_child = ref.firstChild;
                while ((node = container.lastChild)) {
                    first_child = ref.insertBefore(node, first_child);
                }
                break;
            case "beforeend":
                while ((node = container.firstChild)) {
                    ref.appendChild(node);
                }
                break;
            case "afterend":
                next_sibling = ref.nextSibling;
                while ((node = container.lastChild)) {
                    next_sibling = ref_parent.insertBefore(node, next_sibling);
                }
                break;
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const logos = {
        'igromania': 'igromania.svg',
        'dtf': 'dtf.png',
        'stopgame': 'stopgame.png',
        'kanobu': 'kanobu.png',
        'lki': 'lki.png',
        'bestgamer': 'bestgamerICON.png',
        'zog': 'zog.png'
    };

    const fancy_names = {
        'igromania': 'Игромания',
        'dtf': 'DTF',
        'stopgame': 'StopGame.ru',
        'kanobu': 'Канобу',
        'lki': 'ЛКИ',
        'bestgamer': 'BestGamer.ru',
        'zog': 'Zone of Games'
    };

    let records = [];
    const loaded_event = new CustomEvent('records.loaded', {
        bubbles: true
    });

    function compile_all() {
        const data_files = [
            'dtf_main',
            'igromania_main',
            'stopgame_main',
            'stopgame_stream',
            'stopgame_infact',
            'kanobu',
            'lki',
            'bestgamer',
            'zog'
        ];
        const needed = data_files.length;
        let finished = 0;
        for (let i in data_files) {
            fetch('./data/' + data_files[i] + '.json')
                .then(res => res.json())
                .then(data => {
                    records = records.concat(data);
                    ++finished;
                    if (finished === needed) {
                        document.dispatchEvent(loaded_event)
                    }
                })
        }
    }

    const base_card =
        `<div class="col-xs-12 col-md-4 col-xl-3 pb-4 memorial-card-column">
            <div class="card memorial-card {nourl}" data-year="{year}" data-what="{where}">
                {logo}
                {img}
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title">{title}</h5>
                        <p class="card-text">{teaser_text}</p>
                    </div>
                </div>
                    <div class="card-footer text-muted">
                        {url} <span class="float-right">{date}</span>
                    </div>
            </div>
        </div>`;
    const card_logo = '<img class="logo" src="{logo}" alt="logo">';
    const card_image = '<img src="{img}" class="card-img-top" alt="card image" loading="lazy">';
    const card_url = '<a href="{url}" target="_blank" class="btn btn-primary btn-sm">Перейти к материалу</a>';
    const card_nourl = '<a href="https://discord.gg/zDxKb44" target="_blank" class="btn btn-danger btn-sm">Нужна помощь в поиске!</a>';

    let records_container = document.querySelector('#records_container')

    let imgPlaceholder = './logo/placeholder.jpg'

    function draw_card(record) {
        let card = base_card
            .replace('{title}', record.title)
            .replace('{teaser_text}', record.teaser_text)
            .replace('{date}', record.date.day + '.' + record.date.month + '.' + record.date.year)
            .replace('{year}', record.date.year)
            .replace('{where}', record.where);

        if (record.date.day > 0) {
            card = card.replace('{date}', record.date.day + '.' + record.date.month + '.' + record.date.year)
        } else {
            card = card.replace('{date}', record.date.month + '.' + record.date.year)
        }

        if (record.url) {
            card = card.replace('{url}', card_url.replace('{url}', record.url)).replace('{nourl}', '')
        } else {
            card = card.replace('{url}', card_nourl).replace('{nourl}', 'border-danger')
        }

        if (record.img) {
            card = card.replace('{img}', card_image.replace('{img}', '//images.weserv.nl/?url=' + record.img + '&q=50&w=480&l=5&il'))
        } else {
            card = card.replace('{img}', card_image.replace('{img}', imgPlaceholder))
        }

        if (logos[record.where]) {
            card = card.replace('{logo}', card_logo.replace('{logo}', './res/image/' + logos[record.where]))
        } else {
            card = card.replace('{logo}', '')
        }

        records_container.insertAdjacentHTML('beforeend', card)
    }

    function* iterate(_records) {
        for (let i in _records) {
            yield _records[i];
        }
    }

    function draw(_records) {
        let mode = window.localStorage.getItem("draw_mode");
        switch(mode) {
            case "deffered":
                draw_generator(_records);
                break;
            case 'instant':
            case null:
                draw_foreach(_records);
                break;
        }

        Array.from(records_container.querySelectorAll('.card-img-top')).forEach(img => {
            img.addEventListener('error', e => {
                let parentNode = e.target.parentNode
                console.warn(`Ошибка загрузки изображения у материала "${parentNode.querySelector('.card-title').textContent}".`)
                e.target.src = imgPlaceholder
            })
        })
    }

    function draw_foreach(_records) {
        console.log("drawing instant");
        _records.forEach(record => {
            draw_card(record)
        })
    }

    function draw_generator(_records) {
        console.log("drawing deffered");
        let iterator = iterate(records);
        let interval = setInterval(function () {
            let iteritem = iterator.next();
            if (iteritem.done) {
                clearInterval(interval);
            } else {
                draw_card(iteritem.value);
            }
        }, 10);
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
        document.getElementById('placeholder').remove();

        const years = {};
        const sources = {};

        for (let i in records) {
            let record = records[i];

            if (!years[record.date.year]) {
                years[record.date.year] = 0
            }
            ++years[record.date.year];

            if (!sources[record.where]) {
                sources[record.where] = 0
            }
            ++sources[record.where]
        }

        Object.keys(years).forEach(year => {
            let linkNode = document.createElement('a');

            linkNode.classList.add('dropdown-item');
            linkNode.dataset.year = year;
            linkNode.textContent = year + ' (' + years[year] + ')';
            linkNode.href = 'javascript:void(0)';

            document.querySelector('#filters_year').insertAdjacentElement('afterbegin', linkNode)
        });

        Object.keys(sources).forEach(source => {
            let linkNode = document.createElement('a');

            linkNode.classList.add('dropdown-item');
            linkNode.dataset.where = source;
            linkNode.textContent = fancy_names[source] + ' (' + sources[source] + ')';
            linkNode.href = 'javascript:void(0)';

            document.querySelector('#filters_where').insertAdjacentElement('afterbegin', linkNode)
        });
    });

    compile_all();

    function remove_cards() {
        Array.from(document.querySelectorAll('.memorial-card-column')).forEach(card => card.remove())
    }

    function filter(filters) {
        let year;
        if (filters['year'] !== undefined) {
            year = filters['year']
        }

        let where;
        if (filters['where'] !== undefined) {
            where = filters['where']
        }

        return records.filter(function (record) {
            if (year !== undefined && where !== undefined) {
                return record.date.year === year && record.where === where
            } else if (year !== undefined) {
                return record.date.year === year
            } else if (where !== undefined) {
                return record.where === where
            } else {
                return true
            }
        })
    }

    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('dropdown-item')) {
            if ('year' in e.target.dataset || 'where' in e.target.dataset) {
                remove_cards()
            }

            if ('year' in e.target.dataset) {
                draw(filter({'year': Number(e.target.dataset.year)}))
            }

            if ('where' in e.target.dataset) {
                draw(filter({'where': e.target.dataset.where}))
            }

            document.querySelector('#records_container').scrollIntoView({behavior: 'smooth', block: 'start'})
        }
    });

    Array.from(['#unfilter_year', '#unfilter_where']).forEach(id => {
        document.querySelector(id).onclick = () => {
            remove_cards();
            draw(records)
        }
    });

    document.querySelector('#draw_nourl').onclick = () => {
        remove_cards();
        draw(records.filter(function (record) {
            return !record.url
        }))
    }
});
