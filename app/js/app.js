(function() {
    var currencies;

    $.ajax({
        type: 'GET',
        url: 'http://www.nbrb.by/API/ExRates/Currencies'
    }).done(function(response) {
         currencies = response.map(function(item) {
             return {
               id: item.Cur_ID,
               name: item.Cur_Name_Eng,
               abbreviation: item.Cur_Abbreviation   
             };
         });

        initSelect('#from-select');
        initSelect('#to-select');
    });

    $('#amount-for-converting').on('change', function(event) {
        var amount = event.target.value;

    });

    function initSelect(selectId) {
        var $select = $(selectId);
        var selectOptions = '';

        for (var i = 0; i < currencies.length; i++) {
            selectOptions += '<option value="' + currencies[i.id] + '">' + currencies[i].name + '(' + currencies[i].abbreviation + ')' + '</option>';
        }

        $select.append(selectOptions);
    }


})();