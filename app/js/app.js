(function() {
    var currencies, convertedValue;
    var valueForConverting = 0;

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

        initSelect();
    });

    $('#value-for-converting-input').on('change', function(event) {
        valueForConverting = +event.target.value;
    });

    // $('#convert-btn').on('click', function() {
    //     var ratesUrl = 'http://www.nbrb.by/API/ExRates/Rates/' + $('#to-select').val() + '?ParamMode=1';

    //     $.ajax({
    //         type: 'GET',
    //         url: ratesUrl
    //     }).done(function(response) {
    //         convertedValue = +response.Cur_OfficialRate * valueForConverting;

    //         $('#result').html('result: ' + convertedValue);
    //     });
    // });

    function initSelect() {
        var $select = $('#to-select');
        var selectOptions = '';

        for (var i = 0; i < currencies.length; i++) {
            selectOptions += '<option value="' + currencies[i].code + '">' + currencies[i].name + '(' + currencies[i].abbreviation + ')' + '</option>';
        }

        $select.append(selectOptions);
    }
})();