'use strict';

// insertAdjacentHTML polyfill for IE
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

const default_settings = {
    'per_page': 24,
    'image_quality': 80,
    'draw_mode': 'standard'
};
let settings = {
    'per_page': Number(localStorage.getItem('per_page') || default_settings.per_page),
    'image_quality': Number(localStorage.getItem('image_quality') || default_settings.image_quality),
    'draw_mode': localStorage.getItem('draw_mode') in ['standard', 'generator'] ? localStorage.getItem('draw_mode') : default_settings.draw_mode
};

document.addEventListener('DOMContentLoaded', (key, value) => {
    const logos = {
        'igromania': 'igromania.svg',
        'igromania_other': 'igromania.svg',
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
        'igromania_other': 'Игромания Другое',
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
            'igromania_stream',
            'igromania_other',
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
    const card_image = '<img src="{img}" class="card-img-top" alt="card image">';
    const card_url = '<a href="{url}" target="_blank" class="btn btn-primary btn-sm">Перейти к материалу</a>';

    const card_nourl = '<a href="https://discord.gg/zDxKb44" target="_blank" class="btn btn-danger btn-sm">Нужна помощь в поиске!</a>';
    const records_container = document.querySelector('#records_container');
    const imgPlaceholder = './logo/placeholder.jpg';
    const placeholder_element = document.getElementById('placeholder');
    const draw_time = 10;

    /**
     * Format date
     * @param {Object} date
     * @param {Number} date.day
     * @param {Number} date.month
     * @param {Number} date.year
     * @returns {string}
     */
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

    /**
     * Draw a card
     * @param {Object} record
     * @param {String} record.title
     * @param {String} record.teaser_text
     * @param {Object} record.date
     * @param {Number} record.date.day
     * @param {Number} record.date.month
     * @param {Number} record.date.year
     * @param {String} record.img
     * @param {String} record.where
     * @param {String} record.url
     */
    function draw_card(record) {
        let card = base_card
            .replace('{title}', record.title)
            .replace('{teaser_text}', record.teaser_text)
            .replace('{date}', format_date(record.date))
            .replace('{year}', record.date.year.toString())
            .replace('{where}', record.where);

        if (record.url) {
            card = card.replace('{url}', card_url.replace('{url}', record.url)).replace('{nourl}', '')
        } else {
            card = card.replace('{url}', card_nourl).replace('{nourl}', 'border-danger')
        }

        if (record.img) {
            card = card.replace('{img}', card_image.replace('{img}', `https://images.weserv.nl/?url=${record.img}&q=${settings.image_quality}&w=480&il&output=jpg`))
        } else {
            card = card.replace('{img}', card_image.replace('{img}', imgPlaceholder))
        }

        if (logos[record.where]) {
            card = card.replace('{logo}', card_logo.replace('{logo}', './res/image/' + logos[record.where]))
        } else {
            card = card.replace('{logo}', '')
        }

        records_container.insertAdjacentHTML('beforeend', card);
    }

    /**
     * Iterate generator
     * @param {Object} _records
     * @returns {Generator<*, void, ?>}
     */
    function* iterate(_records) {
        for (let i in _records) if (_records.hasOwnProperty(i)) {
            yield _records[i];
        }
    }

    /**
     * draw - центральная функция, вызывая её с записями в аргументе
     * мы присваиваем глобальному current_recordset значение этих записей.
     * если draw вызывается без аргумента то мы просто рендерит current_recordset
     * с учётом текущего current_page.
     * Это всё нужно для того, чтоб при применении фильтров нам не приходилось
     * шерстить полный рекордсет и фильтровать при каждом переходе по страницам
     * в пагинации.
     *
     * @param {Object} [_records]
     */
    function draw(_records) {
        if (_records === undefined) {
            _records = current_recordset;
        } else {
            current_recordset = _records;
        }

        _records = paginate(_records);

        if (settings.draw_mode === 'generator') {
            draw_generator(_records);
        } else {
            draw_foreach(_records);
        }

        setTimeout(() => {
            document.getElementById('records_container').style.height = '';
            placeholder_element.classList.remove('d-block');
            placeholder_element.classList.add('d-none');
        }, draw_time);
    }

    /**
     * pagination stuff
     */
    const pagination_item_base = `<li class="page-item {state}"><button class="page-link paginator-button" data-page="{num}">{num}</button></li>`;
    const pagination_container_top = document.querySelector("#pagination_container_top");
    const pagination_container_bottom = document.querySelector("#pagination_container_bottom");

    let current_page = 1;
    const visible_pages = 6; // Choose only even numbers for greater UI
    const pages_before_after = Math.floor(visible_pages / 2) - 1;

    /**
     * Paginator
     * @param {Object} _records
     * @param {Number} per_page
     * @returns {*}
     */
    function paginate(_records, per_page = Number(settings.per_page)) {
        const page = current_page;
        let total_pages = Math.ceil(_records.length / per_page);

        if (per_page >= _records.length) {
            per_page = _records.length;
        }

        console.group('Pagination details');
        console.log('Per page:', per_page);
        console.log('Total pages:', total_pages);
        console.log('Current page:', current_page);
        console.log('Visible pages:', visible_pages);
        console.log('Pages before and after:', pages_before_after);
        console.groupEnd();

        pagination_container_top.innerHTML = '';
        pagination_container_bottom.innerHTML = '';
        let num_start = 1;
        let num_end = total_pages;

        if (total_pages >= visible_pages) {
            num_end = visible_pages;

            if (page > pages_before_after + 1) {
                num_start = page - pages_before_after;
                num_end = page + pages_before_after;
            }

            if (page >= total_pages - pages_before_after) {
                num_start = total_pages - visible_pages + 1;
                num_end = total_pages;
            }
        }

        console.groupCollapsed('Pagination drawing');
        let pagination_dom = '';

        // Start button
        if (total_pages > 2) {
            pagination_dom += pagination_item_base
                .replace(/{num}/, '1') // data-num
                .replace(/{num}/, '&laquo; <em>1</em>') // button text
                .replace(/{state}/, page === 1 ? 'active' : '');
            console.log('<<');
        }

        // Pages
        for (let i = num_start; i <= num_end; ++i) {
            if (total_pages > 2) {
                if (page <= visible_pages && i === 1) continue;
                if (page >= total_pages - visible_pages + 1 && i === total_pages) continue;
            }

            pagination_dom += pagination_item_base
                .replace(/{num}/g, i)
                .replace(/{state}/, i === page ? 'active' : '');
            console.log('Page', i)
        }

        // End button
        if (total_pages > 2) {
            pagination_dom += pagination_item_base
                .replace(/{num}/, total_pages.toString()) // data-num
                .replace(/{num}/, `<em>${total_pages}</em> &raquo;`) //button text
                .replace(/{state}/, page === total_pages ? 'active' : '');
        }

        console.log('>>');
        console.groupEnd();

        pagination_container_top.insertAdjacentHTML('beforeend', pagination_dom);
        pagination_container_bottom.insertAdjacentHTML('beforeend', pagination_dom);

        document.querySelectorAll('.paginator-button').forEach(item => {
            if (Number(item.dataset.page) !== current_page) {
                item.addEventListener('click', () => {
                    remove_cards();
                    current_page = Number(item.dataset.page);
                    console.log("Drawing page", current_page);
                    draw();

                    route_scroll_to_rc();
                });
            }
        });

        let offset = (page - 1) * per_page;
        return _records.slice(offset, offset + per_page);
    }

    /**
     * @param {Object} _records
     */
    function draw_foreach(_records) {
        console.log('drawing with foreach');
        _records.forEach(record => {
            draw_card(record)
        })
    }

    /**
     * @param {Object} _records
     */
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

    function build_filter_item({ text, ...filterParams }) {
        let filter_item = '<a class="dropdown-item filter-link" ';
        Object.entries(filterParams).forEach(([key, val]) => {
            filter_item += `data-${key}="${val}" `;
        })
        filter_item += `href="javascript:void(0)">${text}</a>`;
        return filter_item;
    }

    /**
     * Возвращает текст по умолчанию для фильтра
     * @param {string} label_key
     */
    function get_default_text(label_key) {
        switch(label_key) {
            case 'sources': {
                return 'Издания'
            }
            case 'years': {
                return 'Годы'
            }
            case 'tags': {
                return 'Теги'
            }
        }
    }

    document.addEventListener('records.loaded', function () {
        /**
         * Необходимо отсортировать полный recordset
         * для дальнейшего использования
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

        document.getElementById('filter_name').innerText = `Все записи (${full_recordset.length})`;
        document.getElementById('records_count').innerText = `На текущий момент их ${full_recordset.length}.`;

        draw(full_recordset);

        const years = {};
        const sources = {};
        const tags = {};

        for (let i in full_recordset) if (full_recordset.hasOwnProperty(i)) {
            let record = full_recordset[i];

            if (!years[record.date.year]) {
                years[record.date.year] = 0
            }
            ++years[record.date.year];

            if (!sources[record.where]) {
                sources[record.where] = 0
            }
            ++sources[record.where]

            record.tags && record.tags.forEach(function (tag) {
                if (!tags[tag]) {
                    tags[tag] = 0
                }
                ++tags[tag]
            })
        }



        const filter_years = Object.keys(years).reverse().map(year =>
            build_filter_item({ year, text: `${year} (${years[year]})` })
        );
        document.querySelector('#filters_year').insertAdjacentHTML('afterbegin', filter_years.join(''));

        const sorted_sources = Object.keys(sources).sort(function (a, b) {
            if (sources[a] > sources[b]) {
                return -1;
            }
            if (sources[a] < sources[b]) {
                return 1;
            }

            return 0;
        });

        const filter_sources = sorted_sources.map(source =>
            build_filter_item({ where: source, text: `${fancy_names[source]} (${sources[source]})`})
        );
        document.querySelector('#filters_where').insertAdjacentHTML('afterbegin', filter_sources.join(''));

        const sorted_tags = Object.keys(tags).sort(function (a, b) {
            if (tags[a] > tags[b]) {
                return -1;
            }
            if (tags[a] < tags[b]) {
                return 1;
            }
            return 0;
        });

        const filter_tags = sorted_tags.map(tag =>
            build_filter_item({ tag, text: `${tag} (${tags[tag]})`})
        );

        filter_tags.splice(2, 0, '<div class="dropdown-divider"></div>') // there are two main tag categories to be separated
        document.querySelector('#filters_tag').insertAdjacentHTML('afterbegin', filter_tags.join(''));

        document.querySelectorAll('.filter-link').forEach(item => {
            item.addEventListener('click', () => {
                current_page = 1;
                remove_cards();
                let label_key;
                if ('where' in item.dataset) {
                    draw(filter({'where': item.dataset.where}));
                    label_key = 'sources'
                }

                if ('year' in item.dataset) {
                    console.log({'year': item.dataset.year});
                    draw(filter({'year': item.dataset.year}));
                    label_key = 'years'
                }

                if ('tag' in item.dataset) {
                    console.log({'tag': item.dataset.tag});
                    draw(filter({'tag': item.dataset.tag}));
                    label_key = 'tags'
                }
                const filter_labels = document.querySelectorAll('.filter-label');
                filter_labels.forEach(filter_label => {
                    const {  dataset: { activated, labelKey: orig_label_key }} = filter_label;
                    const is_activated = activated === 'true';
                    if (orig_label_key === label_key) {
                        filter_label.innerText = is_activated ? get_default_text(label_key) : item.textContent;
                        console.log(filter_label, is_activated)
                        filter_label.dataset.activated = !is_activated;
                    } else {
                        filter_label.innerText = get_default_text(orig_label_key);
                        filter_label.dataset.activated = false;
                    }
                })

                document.getElementById('filter_name').innerText = item.textContent;

                route_scroll_to_rc();
            })
        });
    });

    compile_all();

    function remove_cards() {
        document.getElementById('records_container').style.height = `1080px`;
        Array.from(document.querySelectorAll('.memorial-card-column')).forEach(card => card.remove())
    }

    /**
     * @param filters
     * @returns {*[]}
     */
    function filter(filters) {
        let year;
        if (filters['year'] !== undefined) {
            year = filters['year']
        }

        let where;
        if (filters['where'] !== undefined) {
            where = filters['where']
        }

        let tag;
        if (filters['tag'] !== undefined) {
            tag = filters['tag']
        }
        console.log(tag);
        return full_recordset.filter(function (record) {
            let year_check = !(year !== undefined) || (record.date.year === Number(year));    // (no filter) || (filter passed)
            let where_check = !(where !== undefined) || (record.where === where);
            let tag_check = !(tag !== undefined) || (record.tags && record.tags.includes(tag)); // handle undefined tags on record

            return year_check && where_check && tag_check
        })
    }

    function route_scroll_to_rc() {
        setTimeout(() => {
            document.getElementById('start').scrollIntoView({behavior: 'smooth', block: 'start'})
        }, draw_time);
    }

    Array.from(['unfilter_year', 'unfilter_where', 'unfilter_tag']).forEach(id => {
        document.getElementById(id).onclick = () => {
            current_page = 1;
            remove_cards();
            const filter_labels = document.querySelectorAll('.filter-label');
            filter_labels.forEach(filter_label => {
                const {  dataset: { labelKey: orig_label_key }} = filter_label;
                filter_label.innerText = get_default_text(orig_label_key);
                filter_label.dataset.activated = false;
            })
            document.getElementById('filter_name').innerText = `Все материалы (${full_recordset.length})`;
            draw(full_recordset);

            route_scroll_to_rc();
        }
    });

    document.getElementById('draw_nourl').onclick = () => {
        current_page = 1;
        remove_cards();
        let nourl_recordset = full_recordset.filter(function (record) {
            return !record.url
        });
        document.getElementById('filter_name').innerText = `Материалы без ссылок (${nourl_recordset.length})`;
        draw(nourl_recordset);

        route_scroll_to_rc();
    };

    document.getElementById('default_settings').onclick = () => {
        if (confirm('Данное действие сбросит все настройки. Продолжить?')) {
            updateSettings(default_settings);
        }
    };

    document.getElementById('settings_form').oninput = (event) => {
        let new_settings = {
            'per_page': document.getElementById('per_page_setting').value,
            'image_quality': document.getElementById('image_quality_setting').value,
            'draw_mode': document.querySelector('[name=draw_mode_setting]:checked').value
        };

        console.log(new_settings);
        updateSettings(new_settings);
    };

    function updateSettings(new_settings) {
        settings = new_settings;
        Object.keys(new_settings).forEach(setting => {
            localStorage.setItem(setting, new_settings[setting]);

            if (setting === 'draw_mode') {
                document.getElementById(`draw_mode_${new_settings[setting]}`).checked = 'on';
            } else {
                document.getElementById(setting + '_setting').value = new_settings[setting];
            }
        });
    }

    updateSettings(settings);
});
