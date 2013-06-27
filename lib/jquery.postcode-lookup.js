/**
 * User: Ifeanyi Isitor (ifeanyiisitor@gmail.com)
 * Date: 25/06/2013
 * Time: 15:29
 */

if(jQuery) (function($){

    var apiUsername = '';
    var ukApiUrl =
    {
        byPostcode  : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhere/Interactive/FindByPostcode/v1.00/json3.ws?callback=?',
        byId        : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhere/Interactive/RetrieveById/v1.30/json3.ws?callback=?'
    };
    var ukApiKey = '';
    var $postcodeButton = $('.pl-find-postcode-button');
    var $addressContainer = $('.pl-address-container');
    var field = extractFields();

    if(field.$postCode.val() == '')
    {
        disable($postcodeButton)
    }

    hideAddressSelector()

    field.$postCode.on('keyup', function()
    {
        if(field.$postCode.val())
        {
            enable($postcodeButton);
        }
        else
        {
            disable($postcodeButton);
        }
    });

    $postcodeButton.on('click', function(event)
    {
        event.preventDefault();

        var countryCode = field.$countryCode.val();
        var postcode = field.$postCode.val();

        if(!countryCode.length)
        {
            alert('Please select a valid country'); // TODO: This should come from the a data attribute
        }
        else
        {
            addressFinderFor(countryCode).findAddressesIn(postcode).then(function(result)
            {
                if(result.status.type == 'error')
                {
                    alert(result.status.message);
                }
                else
                {
                    var addressCollection = addressCollectionNormaliserFor(countryCode).normalise(result.addressCollection);

                    populateAddressSelectorWith(addressCollection);

                    showAddressSelector();
                }
            });
        }
    });

    $addressContainer.on('click', 'a', function(event)
    {
        event.preventDefault();

        console.log($(this));
    });

    function populateAddressSelectorWith(addressCollection)
    {
        var $addressItems = $addressContainer.find('.address-items');

        $addressItems.empty();

        $.each(addressCollection.Items, function(index, item)
        {
            var $a = $('<a href=""></a>');
            var $li = $('<li></li>');

            $a.data('id', item.Id);
            $a.html(item.label);

            $li.append($a);

            $addressItems.append($li)
        })
    }

    function disable($element)
    {
        $element.attr('disabled', 'disabled');
    }

    function enable($element)
    {
        $element.removeAttr('disabled');
    }

    function showAddressSelector(summaries)
    {
        $addressContainer.show();
    };

    function hideAddressSelector()
    {
        $addressContainer.hide();
    };

    function addressFinderFor(countryCode)
    {
        if(countryCode === 'GB')
        {
            return getUKPostcodeFinder();
        }
        else
        {
            return getIntPostcodeFinderFor(countryCode);
        }
    }

    function addressCollectionNormaliserFor(countryCode)
    {
        if(countryCode === 'GB')
        {
            return getUKAddressCollectionNormaliser();
        }
        else
        {
            return getIntAddressCollectionNormaliser();
        }
    }
    
    function getUKAddressCollectionNormaliser()
    {
        this.normalise = function(addressCollection)
        {
            var i=0;
            var totalItems = addressCollection.Items.length;

            for(i; i<totalItems; i++)
            {
                var item = addressCollection.Items[i];

                item.label = item.StreetAddress;
            }

            addressCollection.type = 'uk';

            return addressCollection;
        }

        return this;
    }
    
    function getIntAddressCollectionNormaliser()
    {
        // TODO: Implement getIntAddressCollectionNormaliser()
    }

    function getUKPostcodeFinder()
    {
        this.findAddressesIn = function(postcode)
        {
            var result = new $.Deferred();

            callApiWith(ukApiUrl.byPostcode, {Key:ukApiKey, Postcode:postcode, UserName:apiUsername}).then(function(apiResult)
            {
                //apiResult.addressCollection.region = 'UK';

                result.resolve(apiResult);
            });

            return result.promise();
        }

        return this;
    }

    function getIntPostcodeFinderFor(countryCode)
    {
        // TODO: Implement getIntPostcodeFinderFor()
    }

    function callApiWith(apiUrl, apiCredentials)
    {
        var result = new $.Deferred();

        $.getJSON(apiUrl, apiCredentials, function (data)
        {
            var apiResult = {
                status: {
                    type: '',
                    message: ''
                },
                addressCollection: {}
            };
            // Test for an error
            if (data.Items.length == 1 && typeof(data.Items[0].Error) != "undefined")
            {
                apiResult.status.type = 'error';
                apiResult.status.message = data.Items[0].Description;
            }
            else
            {
                // Check if there were any items found
                if (data.Items.length == 0)
                {
                    apiResult.status.type = 'error';
                    apiResult.status.message = 'No addresses found';
                }
                else {
                    apiResult.status.type = 'success';
                    apiResult.addressCollection = data;
                }
            }

            result.resolve(apiResult);
        });

        return result.promise();
    }

    function extractFields()
    {
        var fields = {};

        $('.pl-postcode,.pl-country-code,.pl-street1,.pl-street2,.pl-street3,.pl-city,.pl-county').each(function()
        {
            var $this = $(this);

            if($this.hasClass('pl-postcode'))
            {
                fields.$postCode = $this;
            }

            if($this.hasClass('pl-country-code'))
            {
                fields.$countryCode = $this;
            }

            if($this.hasClass('pl-street1'))
            {
                fields.$street1 = $this;
            }

            if($this.hasClass('pl-street2'))
            {
                fields.$street2 = $this;
            }

            if($this.hasClass('pl-street3'))
            {
                fields.$street3 = $this;
            }

            if($this.hasClass('pl-city'))
            {
                fields.$city = $this;
            }

            if($this.hasClass('pl-county'))
            {
                fields.$county = $this;
            }
        });

        return fields;
    }

})(jQuery);


            /*
            {Key:ukApiKey, Id:Id, PreferredLanguage:'', UserName:apiUsername}

            callApiWith(ukApiUrl.byId, {Key:ukApiKey, Postcode:postcode, UserName:apiUsername}).then(function(apiResult)
            {
                result.resolve(apiResult);
            });
            */
