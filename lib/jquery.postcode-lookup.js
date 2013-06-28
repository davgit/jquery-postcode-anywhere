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

    var intApiUrl =
    {
        byPostcode : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhereInternational/Interactive/RetrieveByPostalCode/v2.20/json3.ws?callback=?'
    };

    var ukApiKey = '';
    var $postcodeButton = $('.pl-find-postcode-button');
    var $addressContainer = $('.pl-address-container');
    var field = extractFields();

    if(field.$postCode.val() == '')
    {
        disable($postcodeButton)
    }

    hide($addressContainer);

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
        var level = 'first';

        if(!countryCode.length)
        {
            alert('Please select a valid country'); // TODO: This should come from the a data attribute
        }
        else
        {
            populateViewWithAddressIn(countryCode, postcode, level);
        }
    });

    $addressContainer.on('change', '.pl-address-chooser', function(event)
    {
        event.preventDefault();

        var $selector = $(this);
        var addressId = $selector.val();
        var countryCode = $selector.data('country-code');
        var level = $selector.data('next-level');

        if(addressId.length)
        {
            populateViewWithAddressIn(countryCode, addressId, level);
        }
    });

    function populateViewWithAddressIn(countryCode, postcode, level)
    {
        addressFinderFor(countryCode, level).findBy(postcode).then(function(result)
        {
            if(result.status.type == 'error')
            {
                alert(result.status.message);
            }
            else
            {
                var addressCollectionViewAdapter = addressCollectionViewAdapterFor(countryCode, result.addressCollection.currentLevel);
                var adaptedAddressCollection = addressCollectionViewAdapter.adapt(result.addressCollection);
                var addressCollectionViewHandler = addressCollectionViewHandlerFor(countryCode, result.addressCollection.currentLevel);

                addressCollectionViewHandler.handle(adaptedAddressCollection);
            }
        });
    }

    function getFirstLevelAddressViewHandler()
    {
        this.handle = function(adaptedAddressCollection)
        {
            $addressContainer.empty();

            var $select = $('<select></select>');

            $select
                .addClass('pl-address-chooser')
                .attr('name', 'address-chooser')
                .data('country-code', adaptedAddressCollection.countryCode)
                .data('current-level', adaptedAddressCollection.currentLevel)
                .data('next-level', adaptedAddressCollection.nextLevel)
                .append(
                    $('<option></option>')
                        .val('')
                        .html(adaptedAddressCollection.firstOptionLabel)
                )

            $.each(adaptedAddressCollection.Items, function(index, item)
            {
                var $option = $('<option></option>');

                $option.val(item.id);
                $option.html(item.label);

                $select.append($option);
            })

            $addressContainer.append($select);

            show($addressContainer);
        }

        return this;
    }

    function getFinalLevelAddressViewHandler()
    {
        this.handle = function(adaptedAddress)
        {
            hide($addressContainer);

            $addressContainer.empty();

            field.$street1.val(adaptedAddress.street1);
            field.$street2.val(adaptedAddress.street2);
            field.$street3.val(adaptedAddress.street3);
            field.$city.val(adaptedAddress.city);
            field.$county.val(adaptedAddress.county);
            field.$countryCode.val(adaptedAddress.countryCode);
            field.$postCode.val(adaptedAddress.postcode);
        }

        return this;
    }

    function show($element)
    {
        $element.show();
    }

    function hide($element)
    {
        $element.hide();
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

    function addressCollectionViewHandlerFor(countryCode, level)
    {
        if(countryCode === 'GB')
        {
            if(level === 'first')
            {
                return getFirstLevelAddressViewHandler();
            }

            if(level === 'final')
            {
                return getFinalLevelAddressViewHandler();
            }
        }
        else
        {
            if(level === 'first')
            {
                return getFirstLevelAddressViewHandler();
            }

            /*
            if(level === 'final')
            {
                return getFinalLevelAddressViewHandler();
            }
            */
        }
    }

    function addressFinderFor(countryCode, level)
    {
        if(level === 'first')
        {
            if(countryCode === 'GB')
            {
                return getFirstLevelUKAddressFinder();
            }
            else
            {
                return getFirstLevelIntAddressFinderFor(countryCode);
            }
        }
        else
        {
            if(countryCode == 'GB')
            {
                return getFinalLevelUKAddressFinder();
            }
            else
            {
                // TODO: Implement
                console.log('Need to implement')
            }
        }
    }

    function addressCollectionViewAdapterFor(countryCode, level)
    {
        if(countryCode === 'GB' && level === 'first')
        {
            return getFirstLevelUKAddressCollectionViewAdapter();
        }
        else if(countryCode === 'GB' && level === 'final')
        {
            return getFinalLevelUKAddressCollectionViewAdapter();
        }
        else
        {
            if(level == 'first')
            {
                return getFirstLevelIntAddressCollectionViewAdapter();
            }

            if(level == 'second')
            {
                return getSecondLevelIntAddressCollectionViewAdapter();
            }

            if(level == 'final')
            {
                return getFinalLevelIntAddressCollectionViewAdapter();
            }
        }
    }
    
    function getFirstLevelUKAddressCollectionViewAdapter()
    {
        this.adapt = function(addressCollection)
        {
            var i=0;
            var totalItems = addressCollection.Items.length;

            for(i; i<totalItems; i++)
            {
                var item = addressCollection.Items[i];

                item.id = item.Id;
                item.label = item.StreetAddress;
            }

            addressCollection.firstOptionLabel = 'Select your building and street';

            return addressCollection;
        }

        return this;
    }

    function getFinalLevelUKAddressCollectionViewAdapter()
    {
        this.adapt = function(addressCollection)
        {
            var item = addressCollection.Items[0];

            addressCollection.street1 = item.Line1;
            addressCollection.street2 = item.Line2;
            addressCollection.street3 = item.Line3;
            addressCollection.city = item.PostTown;
            addressCollection.county = item.County;
            addressCollection.postcode = item.Postcode;
            addressCollection.countryName = item.CountryName;
            addressCollection.countryCode = item.CountryISO2;

            return addressCollection;
        }

        return this;
    }
    
    function getFirstLevelIntAddressCollectionViewAdapter()
    {
        this.adapt = function(addressCollection)
        {
            var adaptedItems = [];
            var result =
            {
                firstOptionLabel: 'Select your street',
                countryCode: addressCollection.countryCode,
                currentLevel: addressCollection.currentLevel,
                nextLevel: addressCollection.nextLevel
            }

            $.each(addressCollection.Items, function(index, item)
            {
                var adaptedItem =
                {
                    id: item.StreetId,
                    label: item.Description
                }

                adaptedItems.push(adaptedItem);
            });

            result.Items = adaptedItems;

            return result;
        }

        return this;
    }

    function getSecondLevelIntAddressCollectionViewAdapter()
    {
        // TODO: Implement getFirstLevelIntAddressCollectionViewAdapter()
    }

    function getFinalLevelIntAddressCollectionViewAdapter()
    {
        // TODO: Implement getFirstLevelIntAddressCollectionViewAdapter()
    }

    function getFirstLevelUKAddressFinder()
    {
        this.findBy = function(postcode)
        {
            var result = new $.Deferred();

            callApiWith(ukApiUrl.byPostcode, {Key:ukApiKey, Postcode:postcode, UserName:apiUsername}).then(function(apiResult)
            {
                apiResult.addressCollection.countryCode = 'GB';
                apiResult.addressCollection.currentLevel = 'first';
                apiResult.addressCollection.nextLevel = 'final';

                result.resolve(apiResult);
            });

            return result.promise();
        }

        return this;
    }

    function getFinalLevelUKAddressFinder()
    {
        this.findBy = function(id)
        {
            var result = new $.Deferred();

            callApiWith(ukApiUrl.byId, {Key:ukApiKey, Id:id, PreferredLanguage:'', UserName:apiUsername}).then(function(apiResult)
            {
                apiResult.addressCollection.countryCode = 'GB';
                apiResult.addressCollection.currentLevel = 'final';
                apiResult.addressCollection.nextLevel = 'none';

                result.resolve(apiResult);
            });

            return result.promise();
        }

        return this;
    }


    function getFirstLevelIntAddressFinderFor(countryCode)
    {
        this.findBy = function(postalCode)
        {
            var result = new $.Deferred();

            callApiWith(intApiUrl.byPostcode, {Key:ukApiKey, Country:countryCode, PostalCode:postalCode, Building:-1}).then(function(apiResult)
            {
                apiResult.addressCollection.countryCode = countryCode;
                apiResult.addressCollection.currentLevel = 'first';
                apiResult.addressCollection.nextLevel = 'second';

                result.resolve(apiResult);
            });

            return result.promise();
        }

        return this;
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



