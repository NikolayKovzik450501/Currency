// response ответ
(function() {
    var currencies, changes;
    
    var fromRate = 1;
    var toRate = 1;

    var blrCurrency = {
        code: 9999,
        name: 'Belarussian ruble',
        abbreviation: 'BLR',
        rate: 1
    };
    //получение информации о существующих валютах
    $.ajax({
        type: 'GET',
        url: 'http://www.nbrb.by/API/ExRates/Currencies'      
    }).then(function(response){ 
         currencies = response.map(function(item) {    // map возвращает новый массив на основании response
            var dateEnd = Date.parse(item.Cur_DateEnd); 
            //если срок вывода валюты из оборота меньше текущего времени, то валюта не поддерживается нацбанком
            if (dateEnd < Date.now()) {
                return null;
            } 
            
            return {
                id: item.Cur_ID,
                code: item.Cur_Code,
                name: item.Cur_Name_Eng,
                abbreviation: item.Cur_Abbreviation   
            };
         }).filter(function(item) {
             return item !== null;
         });
        //формирование массива запросов на получение курсов валют относительно белорусского рубля
         var ratesPromises = currencies.map(function(item) {                
             var ratesUrl = 'http://www.nbrb.by/API/ExRates/Rates/' + item.code + '?ParamMode=1';

             return $.ajax({
                type: 'GET',
                url: ratesUrl
            });
         });

         return Q.all(ratesPromises);
    }).then(function(response) {
        for (var i = 0; i < currencies.length; i++) {
            currencies[i].rate = response[i].Cur_OfficialRate;
        }

        currencies = [blrCurrency].concat(currencies);
        //инициализация селектов конвертера и статистики
        initSelectForConverter('#to-select');
        initSelectForConverter('#from-select');
        initSelectForChanges('#changes-currency-select');
    });

    $('#from-select').on('change', function(event) {
        fromRate = event.target.value;

        changeToConvertingInputAfterChangingCurrency();
    });

    $('#to-select').on('change', function(event) {
        toRate = event.target.value;

        changeToConvertingInputAfterChangingCurrency();
    });

    $('#from-converting-input').on('keyup', function(event) {
        var valueForConverting = +event.target.value;
        var convertedValue = valueForConverting * fromRate / toRate;

        $('#to-converting-input').val(convertedValue);
    });

    $('#to-converting-input').on('keyup', function(event) {
        var valueForConverting = +event.target.value;
        var convertedValue = valueForConverting * toRate / fromRate;

        $('#from-converting-input').val(convertedValue);
    });

    $('#swap-currencies-btn').on('click', function() {
        var tempFromCurrency = $('#from-select').val();
        $('#from-select').val($('#to-select').val());
        $('#to-select').val(tempFromCurrency);

        var tempRate = fromRate;
        fromRate = toRate;
        toRate = tempRate;

        var valueForConverting = +$('#from-converting-input').val() ;
        var convertedValue = valueForConverting * fromRate / toRate;

        $('#to-converting-input').val(convertedValue);
    });

    $('#changes-currency-select').on('change', function(event) {
        deleteAllTraces('changes-graph');
        getChangesOfCurrencyRateAgainstBLRPerYear(+event.target.value);
    });

    function deleteAllTraces(graphId) { 
        try {
            while (true) {
                Plotly.deleteTraces(graphId, 0); 
            }
        } catch (err) {}
    }
    
    function getChangesOfCurrencyRateAgainstBLRPerYear(currencyCode) {            
        //формирование url для запроса измениний изменений валют относительно беларусского рубля за год
        var currentDate = new Date();
        var startDate = (currentDate.getFullYear() - 1) + '-' + currentDate.getMonth() + '-' + currentDate.getDay();
        var endDate = currentDate.getFullYear() + '-' + currentDate.getMonth() + '-' + currentDate.getDay();

        var changesUrl = 'http://www.nbrb.by/API/ExRates/Rates/Dynamics/'+ currencyCode + 
                         '?startDate=' + startDate + 
                         '&endDate=' + endDate; 
         $.ajax({
            type: 'GET',
            url: changesUrl
        }).then(function(resposne) {
            if (resposne.length === 0) {
                alert("Нет статистики для данной валюты!");
                $('#changes-graph').addClass('not-displayed');
                return;
            }

            if ($('#changes-graph').hasClass('not-displayed')) {
                $('#changes-graph').removeClass('not-displayed');
            }

            var dates = resposne.map(function(item) {
                return item.Date;
            });

            var rates = resposne.map(function(item) {
                return  item.Cur_OfficialRate;
            });

            Plotly.plot('changes-graph', [{x: dates, y: rates}], {margin: {t: 0}});
        });
    }

    function changeToConvertingInputAfterChangingCurrency() {
        var valueForConverting = +$('#from-converting-input').val();

        var convertedValue = valueForConverting * fromRate / toRate;

        $('#to-converting-input').val(convertedValue);
    }

    function initSelectForConverter(selectId) {
        var $select = $(selectId);
        var selectOptions = '';

        for (var i = 0; i < currencies.length; i++) {
            selectOptions += '<option value="' + currencies[i].rate + '">' + currencies[i].name + '(' + currencies[i].abbreviation + ')' + '</option>';
        }

        $select.append(selectOptions);
    }

    function initSelectForChanges() {
        var $select = $('#changes-currency-select');
        var selectOptions = '';

        for (var i = 1; i < currencies.length; i++) {
            selectOptions += '<option value="' + currencies[i].id + '">' + currencies[i].name + '(' + currencies[i].abbreviation + ')' + '</option>';
        }

        $select.append(selectOptions);
    }
})();