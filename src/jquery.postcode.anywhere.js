// TODO: Check for 'service down' errors and if any are found, set a specific error message taken from the html
// TODO: Ensure that the lookup button is enabled when the postcode is pasted in
// TODO: Ensure that the selected country is in the list of supported countries (do this also on first load should in case the page loads with a country already selected)
// TODO: Remove invalid country error when the country value changes

(function($){

    var $errorMessage = $('.pl-error-message');
    var $errorMessageText = $errorMessage.find('.pl-error-message-text');
    var $postcodeButton = $('.pl-find-postcode-button');
    var $addressContainer = $('.pl-address-container');
    var $init = $('.pl-init');
    var addressBoxSize = $init.data('plAddressBoxSize');
    var selectedAddressAtLevel = {};
    var supportedCountries;

    var api =
    {
        username: $init.data('plUsername'),
        uk:{
            key: $init.data('plUkApiKey'),
            url: {
                byPostcode  : '//services.postcodeanywhere.co.uk/PostcodeAnywhere/Interactive/FindByPostcode/v1.00/json3.ws?callback=?',
                byId        : '//services.postcodeanywhere.co.uk/PostcodeAnywhere/Interactive/RetrieveById/v1.30/json3.ws?callback=?'
            }
        },
        int:{
            key: $init.data('plIntApiKey'),
            url:{
                byPostcode    : '//services.postcodeanywhere.co.uk/PostcodeAnywhereInternational/Interactive/RetrieveByPostalCode/v2.20/json3.ws?callback=?',
                byStreet      : '//services.postcodeanywhere.co.uk/PostcodeAnywhereInternational/Interactive/ListBuildings/v1.20/json3.ws?callback=?',
                listCountries : '//services.postcodeanywhere.co.uk/PostcodeAnywhereInternational/Interactive/ListCountries/v2.00/json3.ws?callback=?'
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

    var error =
    {
        countryRequired: $init.data('plErrorCountryRequired'),
        noAddressesFound: $init.data('plErrorNoAddressesFound')
    };

    /////////////////////////////////////////////////////////////////

    setDefaultState();

    getSupportedCountries().then(function(result)
    {
        if(result.status !== 'error')
        {
            supportedCountries = adaptCountries(result.addressCollection.Items);
        }

        setInterval(enableLookupButtonDependingOnPostcode, 100);
    });

    field.$countryCode.on('change', function()
    {
        var countryCode = field.$countryCode.val();

        if(countryCode.length)
        {
            if(supportedCountries[countryCode] === undefined)
            {
                hide($postcodeButton)
            }
            else
            {
                show($postcodeButton)

                if(currentErrorMessageIs(error.countryRequired))
                {
                    hideErrorMessage();
                }
            }
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
            showErrorMessageOf(error.countryRequired);
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

        if((addressId !== undefined && addressId !== null) && addressId.length)
        {
            var countryCode = $selector.data('country-code');
            var level = $selector.data('next-level');
            var $option = getSelectedOptionByValueFromSelector($selector, addressId);

            selectedAddressAtLevel[level] = JSON.parse($option.data('stringified'));

            populateViewWithAddressIn(countryCode, addressId, level);
        }
    });

    function populateViewWithAddressIn(countryCode, postcode, level)
    {
        hideErrorMessage()

        addressFinderFor(countryCode, level).findBy(postcode).then(function(result)
        {
            if(result.status.type == 'error')
            {
                showErrorMessageOf(result.status.description);
            }
            else
            {
                var addressCollectionViewAdapter = addressCollectionViewAdapterFor(countryCode, result.addressCollection.currentLevel);
                var adaptedAddressCollection     = addressCollectionViewAdapter.adapt(result.addressCollection);
                var addressCollectionViewHandler = addressCollectionViewHandlerFor(countryCode, result.addressCollection.currentLevel);

                addressCollectionViewHandler.handle(adaptedAddressCollection);
            }
        });
    }

    function enableLookupButtonDependingOnPostcode()
    {
        if(field.$postCode.val())
        {
            enable($postcodeButton);
        }
        else
        {
            disable($postcodeButton);
        }
    }

    function currentErrorMessageIs(message)
    {
        return $errorMessage.html() === message || $errorMessageText.html() === message;
    }

    function hideErrorMessage()
    {
        if($errorMessageText.length)
        {
            $errorMessageText.html('');
        }
        else
        {
            $errorMessage.html('');
        }

        hide($errorMessage);
    }
    
    function setDefaultState()
    {
        hide($addressContainer);

        hide($errorMessage);

        if(field.$postCode.val() == '')
        {
            disable($postcodeButton)
        }
    }

    function showErrorMessageOf(message)
    {
        if($errorMessageText.length)
        {
            $errorMessageText.html(message);
        }
        else
        {
            $errorMessage.html(message);
        }

        show($errorMessage);
    }
    
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

    function addressFinderFor(countryCode, level)
    {
        return strategyFor(countryCode)[level]['addressFinder'](countryCode);
    }
    
    function addressCollectionViewAdapterFor(countryCode, level)
    {
        return strategyFor(countryCode)[level]['addressCollectionViewAdapter']();
    }

    function addressCollectionViewHandlerFor(countryCode, level)
    {
        return strategyFor(countryCode)[level]['addressViewHandler']();
    }

    function strategyFor(countryCode)
    {
        return countryCode === 'GB' ? ukStrategy : intStrategy;
    }

    function getSupportedCountries(filter)
    {
        var result = new $.Deferred();

        callApiWith(api.int.url.listCountries, {Key:api.uk.key, Filter:filter}).then(function(apiResult)
        {
            result.resolve(apiResult);
        });

        return result.promise();
    }

    function adaptCountries(countries)
    {
        var result = {};

        $.each(countries, function()
        {
            var country = this;

            result[country.Iso2] =
            {
                iso3: country.Iso3,
                name: country.Name
            }
        });

        return result;
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
            }
            else
            {
                // Check if there were any items found
                if (data.Items.length == 0)
                {
                    apiResult.status.type = 'error';
                    apiResult.status.message = 'No addresses found';
                    apiResult.status.description = error.noAddressesFound;
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

    function getFirstLevelAddressViewHandler()
    {
        this.handle = function(adaptedAddressCollection)
        {
            $addressContainer.empty();

            handleFirstLevelAddress(adaptedAddressCollection, addressBoxSize);
        }

        return this;
    }

    function handleFirstLevelAddress(adaptedAddressCollection, size)
    {
        var $select = $('<select></select>');

        if(size !== undefined)
        {
            $select.attr('size', size);
        }

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
            );

        $.each(adaptedAddressCollection.Items, function(index, item)
        {
            var $option = $('<option></option>');

            $option.val(item.id);
            $option.html(item.label);
            $option.data('stringified', item.stringified);
            $option.data('test', 'yes');

            $select.append($option);
        });

        $addressContainer.append($select);

        show($addressContainer);
    }

    function getFinalLevelAddressViewHandler()
    {
        this.handle = function(adaptedAddress)
        {
            hide($addressContainer);

            field.$street1.val(adaptedAddress.street1);
            field.$street2.val(adaptedAddress.street2);
            field.$street3.val(adaptedAddress.street3);
            field.$city.val(adaptedAddress.city);
            field.$countryCode.val(adaptedAddress.countryCode);
            field.$postCode.val(adaptedAddress.postcode);

            // Don't use a cached version of the county field, should in case it has
            // ben converted to select dropdown for example, for US states
            $('.pl-county').val(adaptedAddress.county);

            $addressContainer.empty();
        };

        return this;
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    var ukStrategy =
    {
        first:
        {
            addressFinder: function getFirstLevelUKAddressFinder()
            {
                this.findBy = function (postcode)
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
            },

            addressCollectionViewAdapter: function getFirstLevelUKAddressCollectionViewAdapter()
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
            },

            addressViewHandler: getFirstLevelAddressViewHandler
        },
        final:
        {
            addressFinder: function getFinalLevelUKAddressFinder()
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
            },

            addressCollectionViewAdapter: function getFinalLevelUKAddressCollectionViewAdapter()
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
            },

            addressViewHandler: getFinalLevelAddressViewHandler
        }

    }

    var intStrategy =
    {
        first:
        {
            addressFinder: function getFirstLevelIntAddressFinderFor(countryCode)
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
            },

            addressCollectionViewAdapter: function getFirstLevelIntAddressCollectionViewAdapter()
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
            },

            addressViewHandler: getFirstLevelAddressViewHandler
        },

        second:
        {
            addressFinder: function getSecondLevelIntAddressFinderFor(countryCode)
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
            },

            addressCollectionViewAdapter: function getSecondLevelIntAddressCollectionViewAdapter()
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
            },

            addressViewHandler: function getSecondLevelIntAddressViewHandler()
            {
                this.handle = function(adaptedAddressCollection)
                {
                    handleFirstLevelAddress(adaptedAddressCollection, addressBoxSize);

                    $addressContainer.find('select.first').attr('size', 1);
                }

                return this;
            }
        },

        final:
        {
            addressFinder: function getFinalLevelIntAddressFinderFor(countryCode)
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
            },

            addressCollectionViewAdapter: function getFinalLevelIntAddressCollectionViewAdapter()
            {
                this.adapt = function(addressCollection)
                {

                    var address = addressCollection.streetData;
                    var building = addressCollection.buildingData;

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
            },

            addressViewHandler: getFinalLevelAddressViewHandler
        }
    }

})(jQuery);