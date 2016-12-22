(function() {
    var currencies;
    
    var fromRate = 1;
    var toRate = 1;

    var blrCurrency = {
        code: 9999,
        name: 'Belarussian ruble',
        abbreviation: 'BLR',
        rate: 1
    };

    $.ajax({
        type: 'GET',
        url: 'http://www.nbrb.by/API/ExRates/Currencies'
    }).then(function(response) {
         currencies = response.map(function(item) {
            var dateEnd = Date.parse(item.Cur_DateEnd);
            
            if (dateEnd < Date.now()) {
                return null;
            } 
            
            return {
               code: item.Cur_Code,
               name: item.Cur_Name_Eng,
               abbreviation: item.Cur_Abbreviation   
            };
         }).filter(function(item) {
             return item !== null;
         });
        
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

        initSelect('#to-select');
        initSelect('#from-select');
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

    function changeToConvertingInputAfterChangingCurrency() {
        var valueForConverting = +$('#from-converting-input').val();

        var convertedValue = valueForConverting * fromRate / toRate;

        $('#to-converting-input').val(convertedValue);
    }

    function initSelect(selectId) {
        var $select = $(selectId);
        var selectOptions = '';

        for (var i = 0; i < currencies.length; i++) {
            selectOptions += '<option value="' + currencies[i].rate + '">' + currencies[i].name + '(' + currencies[i].abbreviation + ')' + '</option>';
        }

        $select.append(selectOptions);
    }
})();