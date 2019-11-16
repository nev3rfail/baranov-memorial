'use strict';

if (self.document && !('insertAdjacentHTML' in document.createElementNS('http://www.w3.org/1999/xhtml', '_'))) {
    HTMLElement.prototype.insertAdjacentHTML = function (position, html) {
        let ref = this,
            container = ref.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml', '_'),
            ref_parent = ref.parentNode,
            node, first_child, next_sibling;

        container.innerHTML = html;

        switch (position.toLowerCase()) {
            case 'beforebegin':
                while ((node = container.firstChild)) {
                    ref_parent.insertBefore(node, ref);
                }
                break;
            case 'afterbegin':
                first_child = ref.firstChild;
                while ((node = container.lastChild)) {
                    first_child = ref.insertBefore(node, first_child);
                }
                break;
            case 'beforeend':
                while ((node = container.firstChild)) {
                    ref.appendChild(node);
                }
                break;
            case 'afterend':
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
        'zog': 'zog.png',
        'vch': 'vch.png'
    };

    const fancy_names = {
        'igromania': 'Игромания',
        'dtf': 'DTF',
        'stopgame': 'StopGame.ru',
        'kanobu': 'Канобу',
        'lki': 'ЛКИ',
        'bestgamer': 'BestGamer.ru',
        'zog': 'Zone of Games',
        'vch': 'Вечерние Челны'
    };

    let full_recordset = [];
    let current_recordset = [];
    let running_interval;
    const loaded_event = new CustomEvent('records.loaded', {
        bubbles: true
    });

    function compile_all() {
        const data_files = [
            'dtf_main',
            'igromania_main',
            'igromania_forum',
            'stopgame_main',
            'stopgame_stream',
            'stopgame_infact',
            'kanobu',
            'lki',
            'bestgamer',
            'zog',
            'vch'
        ];
        const needed = data_files.length;
        let finished = 0;
        for (let i in data_files) {
            fetch('./data/' + data_files[i] + '.json')
                .then(res => res.json())
                .then(data => {
                    full_recordset = full_recordset.concat(data);
                    ++finished;
                    if (finished === needed) {
                        document.dispatchEvent(loaded_event)
                    }
                })
        }
    }

    /**
     * pagination stuff
     */
    const pagination_item_base = `<li class="page-item"><a class="page-link bg-primary" href="javascript:void(0)" data-page="{num}">{num}</a></li>`;
    const pagination_container_top = document.querySelector("#pagination_container_top");
    const pagination_container_bottom = document.querySelector("#pagination_container_bottom");
    const per_page = 24;
    let current_page = 1;

    /**
     * cards stuff
     */
    const base_card = `
        <div class="col-xs-12 col-md-4 col-xl-3 pb-4 memorial-card-column">
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
                        {url} <span class="float-right date-span">{date}</span>
                    </div>
            </div>
        </div>`;
    const card_logo = '<img class="logo" src="{logo}" alt="logo">';
    const card_image = '<img src="{img}" class="card-img-top" alt="card image" loading="lazy">';
    const card_url = '<a href="{url}" target="_blank" class="btn btn-primary btn-sm">Перейти к материалу</a>';
    const card_nourl = '<a href="https://discord.gg/zDxKb44" target="_blank" class="btn btn-danger btn-sm">Нужна помощь в поиске!</a>';
    const records_container = document.querySelector('#records_container');
    const imgPlaceholder = './logo/placeholder.jpg';
    const placeholder_element = document.getElementById('placeholder');
    const draw_time = 10;

    function format_date(date) {
        let date_str = date.day + '';

        if (date_str === '0') {             // no day
            date_str = ''
        } else if (date_str.length === 1) { // 1-digit day
            date_str = '0' + date_str + '.'
        } else {
            date_str = date_str + '.'       // 2-digit day
        }

        if ((date.month + '').length === 1) {
            date_str = date_str + '0' + date.month + '.'
        } else {
            date_str = date_str + date.month + '.'
        }

        date_str = date_str + date.year;
        return date_str
    }

    function draw_card(record) {
        let card = base_card
            .replace('{title}', record.title)
            .replace('{teaser_text}', record.teaser_text)
            .replace('{date}', format_date(record.date))
            .replace('{year}', record.date.year)
            .replace('{where}', record.where);

        if (record.url) {
            card = card.replace('{url}', card_url.replace('{url}', record.url)).replace('{nourl}', '')
        } else {
            card = card.replace('{url}', card_nourl).replace('{nourl}', 'border-danger')
        }

        if (record.img) {
            card = card.replace('{img}', card_image.replace('{img}', '//images.weserv.nl/?url=' + record.img + '&q=60&w=480&l=5&il'))
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

    /**
     * draw центральная функция, вызывая её с записями в аргументе
     * мы присваиваем глобальному current_recordset значение этих записей.
     * если draw вызывается без аргумента то мы просто рендерит current_recordset
     * с учётом текущего current_page.
     * Это всё нужно для того, чтоб при применении фильтров нам не приходилось
     * шерстить полный рекордсет и фильтровать при каждом переходе по страницам
     * в пагинации.
     *
     */
    function draw(_records) {
        if(_records === undefined) {
            _records = current_recordset;
        } else {
            current_recordset = _records;
        }

        _records = paginate(_records);

        let mode = localStorage.getItem("draw_mode");

        switch(mode) {
            case "foreach":
                draw_foreach(_records);
                break;
            case null:
            case 'generator':
            default:
                draw_generator(_records);
                break;
        }
        setTimeout(() => {
            placeholder_element.classList.add("hidden");
        }, draw_time);
    }

    function paginate(_records) {
        const page = current_page;
        let total_pages = Math.ceil(_records.length / per_page);
        console.log("Total pages", total_pages, "current page", current_page);
        /*if (pagination_container_top.childElementCount === total_pages) {
            [pagination_container_top, pagination_container_bottom].forEach(container => {
                container.querySelector("[class*=active]").classList.remove("active");
                container.querySelector('[data-page="'+page+'"]').parentNode.classList.add("active");
            })
        } else {*/
            pagination_container_top.innerHTML = '';
            pagination_container_bottom.innerHTML = '';
            let num_start;
            let num_end;

            if(page <= 3) {
                num_start = 1;
                num_end = 5;
            } else {
                num_start = page-2;
            }

            if (!num_end) {
                if (page > total_pages - 3) {
                    num_end = total_pages;
                    num_start = total_pages-5;
                } else {
                    num_end = page + 2;
                }
            }

            if (total_pages >= 5 && page-2 > 1) {
                let pagination_item = pagination_item_base.replace(/{num}/, 1);
                pagination_item = pagination_item.replace(/{num}/, "<<");
                pagination_container_top.insertAdjacentHTML('beforeend', pagination_item);
                pagination_container_bottom.insertAdjacentHTML('beforeend', pagination_item);
            }

            for (let i = num_start; i <= num_end; ++i) {
                console.log("drawing item", i);
                let pagination_item = pagination_item_base.replace(/{num}/g, i);
                if(i == page) {
                    pagination_item = pagination_item.replace("page-item", "page-item active");
                }
                pagination_container_top.insertAdjacentHTML('beforeend', pagination_item);
                pagination_container_bottom.insertAdjacentHTML('beforeend', pagination_item);
            }

            if (total_pages >= 5 && page+2 < total_pages) {
                let pagination_item = pagination_item_base.replace(/{num}/, total_pages);
                pagination_item = pagination_item.replace(/{num}/, ">>");
                pagination_container_top.insertAdjacentHTML('beforeend', pagination_item);
                pagination_container_bottom.insertAdjacentHTML('beforeend', pagination_item);
            }
        //}

        let offset = (page - 1) * per_page;
        return _records.slice(offset, offset + per_page);
    }

    function draw_foreach(_records) {
        console.log('drawing with foreach');
        _records.forEach(record => {
            draw_card(record)
        })
    }

    function draw_generator(_records) {
        console.log('drawing with generator');
        let iterator = iterate(_records);
        if (running_interval) {
            clearInterval(running_interval);
        }
        running_interval = setInterval(function () {
            let iteritem = iterator.next();
            if (iteritem.done) {
                clearInterval(running_interval);
            } else {
                draw_card(iteritem.value);
            }
        }, draw_time);
    }

    document.addEventListener('records.loaded', function () {
        /**
         * Необходимо отсортировать полный recordset
         * для дальнейшего использования
         *
         */
        full_recordset = full_recordset.sort(function (a, b) {
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


        draw(full_recordset);

        const years = {};
        const sources = {};

        for (let i in full_recordset) {
            let record = full_recordset[i];

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
        placeholder_element.classList.remove("hidden");
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

        return full_recordset.filter(function (record) {
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

    function scroll_to_rc() {
        pagination_container_top.scrollIntoView({behavior: 'smooth', block: 'start'})
    }

    function route_scroll_to_rc() {
        let mode = localStorage.getItem('draw_mode');
        switch (mode) {
            case 'foreach':
                setTimeout(() => {
                    scroll_to_rc()
                }, draw_time);
                break;
            case null:
            case 'generator':
            default:
                scroll_to_rc();
                break;
        }
    }

    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('dropdown-item')) {
            if ('year' in e.target.dataset || 'where' in e.target.dataset) {
                current_page = 1;
                remove_cards()
            }

            if ('year' in e.target.dataset) {
                draw(filter({'year': Number(e.target.dataset.year)}))
            }

            if ('where' in e.target.dataset) {
                draw(filter({'where': e.target.dataset.where}))
            }

            route_scroll_to_rc();

        } else if(e.target.classList.contains('page-link') && Number(e.target.dataset.page) !== current_page) {
            remove_cards();
            current_page = Number(e.target.dataset.page);
            console.log("Drawing page", current_page);
            draw();

            route_scroll_to_rc();
        }

    });

    Array.from(['#unfilter_year', '#unfilter_where']).forEach(id => {
        document.querySelector(id).onclick = () => {
            current_page = 1;
            remove_cards();
            draw(full_recordset)
        }
    });

    document.querySelector('#draw_nourl').onclick = () => {
        current_page = 1;
        remove_cards();
        draw(full_recordset.filter(function (record) {
            return !record.url
        }))
    }
});
