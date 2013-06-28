/**
 * User: Ifeanyi Isitor (ifeanyiisitor@gmail.com)
 * Date: 25/06/2013
 */

if(jQuery) (function($){

    var $init = $('.pl-init');
    var api =
    {
        username: $init.data('plUsername'),
        uk:{
            key: $init.data('plUkApiKey'),
            url: {
                byPostcode  : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhere/Interactive/FindByPostcode/v1.00/json3.ws?callback=?',
                byId        : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhere/Interactive/RetrieveById/v1.30/json3.ws?callback=?'
            }
        },
        int:{
            key: $init.data('plIntApiKey'),
            url:{
                byPostcode : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhereInternational/Interactive/RetrieveByPostalCode/v2.20/json3.ws?callback=?',
                byStreet   : 'http://services.postcodeanywhere.co.uk/PostcodeAnywhereInternational/Interactive/ListBuildings/v1.20/json3.ws?callback=?'
            }
        }
    }

    var field =
    {
        $postCode    : $('.pl-postcode'),
        $countryCode : $('.pl-country-code'),
        $street1     : $('.pl-street1'),
        $street2     : $('.pl-street2'),
        $street3     : $('.pl-street3'),
        $city        : $('.pl-city'),
        $county      : $('.pl-county')
    };

    var $postcodeButton = $('.pl-find-postcode-button');
    var $addressContainer = $('.pl-address-container');
    var selectedAddressAtLevel = {};

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
        var $option = getSelectedOptionByValueFromSelector($selector, addressId);

        selectedAddressAtLevel[level] = JSON.parse($option.data('stringified'));

        if(addressId.length)
        {
            populateViewWithAddressIn(countryCode, addressId, level);
        }
    });
    
    function getSelectedOptionByValueFromSelector($selector, value)
    {
        var $selectedOption;

        $selector.find('option').each(function()
        {
            var $option = $(this);

            if($option.val() == value)
            {
                $selectedOption = $option;

                return false;
            }
        });

        return $selectedOption;
    }

    function populateViewWithAddressIn(countryCode, postcode, level)
    {
        addressFinderFor(countryCode, level).findBy(postcode).then(function(result)
        {
            if(result.status.type == 'error')
            {
                alert(result.status.description);
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

            handleFirstLevelAddress(adaptedAddressCollection);
        }

        return this;
    }

    function getSecondLevelIntAddressViewHandler()
    {
        this.handle = function(adaptedAddressCollection)
        {
            handleFirstLevelAddress(adaptedAddressCollection);
        }

        return this;
    }

    function handleFirstLevelAddress(adaptedAddressCollection)
    {
        var $select = $('<select></select>');

        $select
            .addClass('pl-address-chooser')
            .addClass(adaptedAddressCollection.currentLevel)
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
            $option.data('stringified', item.stringified);
            $option.data('test', 'yes');

            $select.append($option);
        })

        $addressContainer.append($select);

        show($addressContainer);
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

            if(level === 'second')
            {
                return getSecondLevelIntAddressViewHandler();
            }

            if(level === 'final')
            {
                return getFinalLevelAddressViewHandler();
            }
        }
    }

    function addressFinderFor(countryCode, level)
    {
        if(countryCode === 'GB')
        {
            if(level === 'first')
            {
                return getFirstLevelUKAddressFinder();
            }
            if(level === 'final')
            {
                return getFinalLevelUKAddressFinder();
            }
        }
        else
        {
            if(level === 'first')
            {
                return getFirstLevelIntAddressFinderFor(countryCode)
            }
            if(level === 'second')
            {
                return getSecondLevelIntAddressFinderFor(countryCode);
            }
            if(level === 'final')
            {
                return getFinalLevelIntAddressFinderFor(countryCode);
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
                item.stringified = JSON.stringify(item);
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
            var address = addressCollection.Items[0];

            addressCollection.street1 = address.Company.length ? address.Company + ', ' + address.Line1 : address.Line1;
            addressCollection.street2 = address.Line2;
            addressCollection.street3 = address.Line3;
            addressCollection.city = address.PostTown;
            addressCollection.county = address.County;
            addressCollection.postcode = address.Postcode;
            addressCollection.countryName = address.CountryName;
            addressCollection.countryCode = address.CountryISO2;

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
                    label: item.Description,
                    stringified: JSON.stringify(item)
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
        this.adapt = function(addressCollection)
        {
            var adaptedItems = [];
            var result =
            {
                firstOptionLabel: 'Select your building',
                countryCode: addressCollection.countryCode,
                currentLevel: addressCollection.currentLevel,
                nextLevel: addressCollection.nextLevel
            }

            $.each(addressCollection.Items, function(index, item)
            {
                var adaptedItem =
                {
                    id: item.Building,
                    label: item.Description,
                    stringified: JSON.stringify(item)
                }

                adaptedItems.push(adaptedItem);
            });

            result.Items = adaptedItems;

            return result;
        }

        return this;
    }

    function getFinalLevelIntAddressCollectionViewAdapter()
    {
        this.adapt = function(addressCollection)
        {

            var address = addressCollection.streetData;
            var building = addressCollection.buildingData;

            console.log(address)
            console.log(building)

            addressCollection.street1 = building.Description;
            addressCollection.street2 = '';
            addressCollection.street3 = '';
            addressCollection.city = address.City;
            addressCollection.county = address.State.length ? address.State : address.District;
            addressCollection.postcode = address.PostalCode;
            addressCollection.countryName = address.Country;

            return addressCollection;
        }

        return this;
    }

    function getFirstLevelUKAddressFinder()
    {
        this.findBy = function(postcode)
        {
            var result = new $.Deferred();

            callApiWith(api.uk.url.byPostcode, {Key:api.uk.key, Postcode:postcode, UserName:api.username}).then(function(apiResult)
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

            callApiWith(api.uk.url.byId, {Key:api.uk.key, Id:id, PreferredLanguage:'', UserName:api.username}).then(function(apiResult)
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

            callApiWith(api.int.url.byPostcode, {Key:api.int.key, Country:countryCode, PostalCode:postalCode, Building:-1}).then(function(apiResult)
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

    function getSecondLevelIntAddressFinderFor(countryCode)
    {
        this.findBy = function(streetId)
        {
            var result = new $.Deferred();

            callApiWith(api.int.url.byStreet, {Key:api.int.key, StreetId:streetId}).then(function(apiResult)
            {
                apiResult.addressCollection.countryCode = countryCode;
                apiResult.addressCollection.currentLevel = 'second';
                apiResult.addressCollection.nextLevel = 'final';

                result.resolve(apiResult);
            });

            return result.promise();
        }

        return this;
    }

    function getFinalLevelIntAddressFinderFor(countryCode)
    {
        this.findBy = function(id)
        {
            var result = new $.Deferred();

            setTimeout(function()
            {
                var apiResult = {
                    status: {
                        type: 'success',
                        message: ''
                    },
                    addressCollection: {
                        countryCode : countryCode,
                        currentLevel : 'final',
                        nextLevel : 'none',
                        streetData: selectedAddressAtLevel['second'],
                        buildingData: selectedAddressAtLevel['final']
                    }
                }

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
                apiResult.status.description = data.Items[0].Cause;

                console.log(data.Items[0])
            }
            else
            {
                // Check if there were any items found
                if (data.Items.length == 0)
                {
                    apiResult.status.type = 'error';
                    apiResult.status.message = 'No addresses found';
                    apiResult.status.description = 'No addresses were found';

                    console.log(data)
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

})(jQuery);



