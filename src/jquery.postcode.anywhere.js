(function($){

    var defaultOptions = {
        initContainer           : '.pl-init',
        errorMessageContainer   : '.pl-error-message',
        errorMessageText        : '.pl-error-message-text',
        findPostcodeButton      : '.pl-find-postcode-button',
        addressResultsContainer : '.pl-address-container',
        fieldClasses            :
        {
            postcode        : 'pl-postcode',
            countryCode     : 'pl-country-code',
            street1         : 'pl-street1',
            street2         : 'pl-street2',
            street3         : 'pl-street3',
            city            : 'pl-city',
            county          : 'pl-county',
            addressSelector : 'pl-address-chooser'
        }
    };

    var PostcodeAnywhere = function(target, userOptions)
    {
        var options = $.extend({}, defaultOptions, userOptions);

        var $init = $(target);
        var $errorMessage = $(options.errorMessageContainer);
        var $errorMessageText = $errorMessage.find(options.errorMessageText);
        var $postcodeButton = $(options.findPostcodeButton);
        var $addressContainer = $(options.addressResultsContainer);
        var addressBoxSize = $init.data('plAddressBoxSize');
        var selectedAddressAtLevel = {};
        var supportedCountries;
        var serviceErrorCodes = [-1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

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
                    listCountries : '//services.postcodeanywhere.co.uk/Extras/Lists/CountryData/v2.00/json3.ws?callback=?'
                }
            }
        };

        var field = {};

        var error =
        {
            countryRequired: $init.data('plErrorCountryRequired'),
            noAddressesFound: $init.data('plErrorNoAddressesFound'),
            serviceUnavailable: $init.data('plErrorServiceUnavailable')
        };

        /////////////////////////////////////////////////////////////////

        setFieldClasses();

        setDefaultState();

        setupCountryChangeWatcher();

        $.fn.postcodeAnywhere = function(settings)
        {
            setDefaultState();

            if(settings.fieldSelectors !== undefined)
            {
                for(var selectorKey in settings.fieldSelectors)
                {
                    $(settings.fieldSelectors[selectorKey]).addClass(options.fieldClasses[selectorKey]);

                    field['$' + selectorKey] = $('.' + options.fieldClasses[selectorKey]);
                }

                setupCountryChangeWatcher();
            }

            return this;
        };

        getSupportedCountries().then(function(result)
        {
            if(result.status.type !== 'error')
            {
                supportedCountries = adaptCountries(result.collection.Items);

                if(countryHasBeenSelected() && selectedCountryIsNotSupported())
                {
                    hide($postcodeButton);
                }
            }
            else
            {
                showErrorMessageOf(result.status.description);
            }

            setInterval(enableLookupButtonDependingOnPostcode, 100);
        });

        $postcodeButton.on('click', function(event)
        {
            event.preventDefault();

            var countryCode = field.$countryCode.val();
            var postcode = field.$postcode.val();
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

        $addressContainer.on('change', '.' + options.fieldClasses.addressSelector , function(event)
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

        function setupCountryChangeWatcher()
        {
            field.$countryCode.on('change', function()
            {
                var countryCode = field.$countryCode.val();

                if(countryCode.length)
                {
                    if(supportedCountries[countryCode] === undefined)
                    {
                        hide($postcodeButton);
                    }
                    else
                    {
                        show($postcodeButton);

                        if(currentErrorMessageIs(error.countryRequired))
                        {
                            hideErrorMessage();
                        }
                    }
                }
            });
        }

        function countryHasBeenSelected()
        {
            var countryCode = field.$countryCode.val();

            if(countryCode.length)
            {
                return true;
            }

            return false;
        }

        function selectedCountryIsNotSupported()
        {
            var countryCode = field.$countryCode.val();

            if(supportedCountries[countryCode] === undefined)
            {
                return true;
            }

            return false;
        }

        function setFieldClasses()
        {
            for(var classKey in options.fieldClasses)
            {
                field['$' + classKey] = $('.' + options.fieldClasses[classKey]);
            }
        }

        function populateViewWithAddressIn(countryCode, postcode, level)
        {
            hideErrorMessage();

            addressFinderFor(countryCode, level).findBy(postcode).then(function(result)
            {
                if(result.status.type == 'error')
                {
                    showErrorMessageOf(result.status.description);
                }
                else
                {
                    var addressCollectionViewAdapter = addressCollectionViewAdapterFor(countryCode, result.collection.currentLevel);
                    var adaptedAddressCollection     = addressCollectionViewAdapter.adapt(result.collection);
                    var addressCollectionViewHandler = addressCollectionViewHandlerFor(countryCode, result.collection.currentLevel);

                    addressCollectionViewHandler.handle(adaptedAddressCollection);
                }
            });
        }

        function arrayOf(items)
        {
            this.contains = function(item)
            {
                var result = false;

                $.each(items, function(index, eachItem)
                {
                    if(eachItem == item)
                    {
                        result = true;

                        return false;
                    }
                });

                return result;
            };

            return this;
        }

        function enableLookupButtonDependingOnPostcode()
        {
            if(field.$postcode.val())
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

            if(field.$postcode.val() === '')
            {
                disable($postcodeButton);
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

                if(country.Postcodes)
                {
                    result[country.Iso2] =
                    {
                        iso3: country.Iso3,
                        name: country.Name
                    };
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
                    collection: {}
                };
                // Test for an error
                if (data.Items.length == 1 && typeof(data.Items[0].Error) != "undefined")
                {
                    apiResult.status.type = 'error';
                    apiResult.status.code = data.Items[0].Error;
                    apiResult.status.message = data.Items[0].Description;
                    apiResult.status.nativeDescription = data.Items[0].Cause;

                    if(arrayOf(serviceErrorCodes).contains(apiResult.status.code))
                    {
                        apiResult.status.description = error.serviceUnavailable;
                    }
                    else
                    {
                        apiResult.status.description = apiResult.status.nativeDescription;
                    }

                }
                else
                {
                    // Check if there were any items found
                    if (data.Items.length === 0)
                    {
                        apiResult.status.type = 'error';
                        apiResult.status.message = 'No addresses found';
                        apiResult.status.description = error.noAddressesFound;
                    }
                    else {
                        apiResult.status.type = 'success';
                        apiResult.collection = data;
                    }
                }

                result.resolve(apiResult);
            });

            return result.promise();
        }

        function getIntFirstLevelAddressViewHandler()
        {
            this.handle = function(adaptedAddressCollection)
            {
                if(adaptedAddressCollection.Items.length > 1)
                {
                    getFirstLevelAddressViewHandler().handle(adaptedAddressCollection);
                }
                else
                {
                    getFinalLevelAddressViewHandler().handle(adaptedAddressCollection);
                }
            };

            return this;
        }

        function getIntFirstLevelAddressViewHandler()
        {
            this.handle = function(adaptedAddressCollection)
            {
                if(adaptedAddressCollection.Items.length > 1)
                {
                    getFirstLevelAddressViewHandler().handle(adaptedAddressCollection);
                }
                else
                {
                    getFinalLevelAddressViewHandler().handle(adaptedAddressCollection);
                }
            };

            return this;
        }

        function getFirstLevelAddressViewHandler()
        {
            this.handle = function(adaptedAddressCollection)
            {
                $addressContainer.empty();

                handleFirstLevelAddress(adaptedAddressCollection, addressBoxSize);
            };

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
                .addClass(options.fieldClasses.addressSelector)
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

            $addressContainer.children('select').eq(1).remove();

            $addressContainer.append($select);

            $select.val(''); // Select the first entry by default

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
                field.$postcode.val(adaptedAddress.postcode);

                // Don't use a cached version of the county field, should in case it has
                // ben converted to select dropdown for example, for US states
                $('.' + options.fieldClasses.county).val(adaptedAddress.county);

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
                            apiResult.collection.countryCode = 'GB';
                            apiResult.collection.currentLevel = 'first';
                            apiResult.collection.nextLevel = 'final';

                            result.resolve(apiResult);
                        });

                        return result.promise();
                    };

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
                    };

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
                            apiResult.collection.countryCode = 'GB';
                            apiResult.collection.currentLevel = 'final';
                            apiResult.collection.nextLevel = 'none';

                            result.resolve(apiResult);
                        });

                        return result.promise();
                    };

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
                    };

                    return this;
                },

                addressViewHandler: getFinalLevelAddressViewHandler
            }

        };

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
                            apiResult.collection.countryCode = countryCode;
                            apiResult.collection.currentLevel = 'first';
                            apiResult.collection.nextLevel = 'second';

                            result.resolve(apiResult);
                        });

                        return result.promise();
                    };

                    return this;
                },

                addressCollectionViewAdapter: function getFirstLevelIntAddressCollectionViewAdapter()
                {
                    this.adapt = function(addressCollection)
                    {

                        if(addressCollection.Items.length === 1 && addressCollection.Items[0].Description.length ===0)
                        {
                            var item = addressCollection.Items[0];

                            addressCollection.street1 = item.street;
                            addressCollection.street2 = '';
                            addressCollection.street3 = '';
                            addressCollection.city = item.City;
                            addressCollection.county = item.State.length ? item.State : item.District;
                            addressCollection.postcode = item.PostalCode;
                            addressCollection.countryName = item.Country;

                            return addressCollection;
                        }
                        else
                        {
                            var adaptedItems = [];
                            var result =
                            {
                                firstOptionLabel: 'Select your street',
                                countryCode: addressCollection.countryCode,
                                currentLevel: addressCollection.currentLevel,
                                nextLevel: addressCollection.nextLevel
                            };

                            $.each(addressCollection.Items, function(index, item)
                            {
                                var adaptedItem =
                                {
                                    id: item.StreetId,
                                    label: item.Description,
                                    stringified: JSON.stringify(item)
                                };

                                adaptedItems.push(adaptedItem);
                            });

                            result.Items = adaptedItems;

                            return result;
                        }
                    };

                    return this;
                },

                addressViewHandler: getIntFirstLevelAddressViewHandler
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
                            apiResult.collection.countryCode = countryCode;
                            apiResult.collection.currentLevel = 'second';
                            apiResult.collection.nextLevel = 'final';

                            result.resolve(apiResult);
                        });

                        return result.promise();
                    };

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
                        };

                        $.each(addressCollection.Items, function(index, item)
                        {
                            var adaptedItem =
                            {
                                id: item.Building,
                                label: item.Description,
                                stringified: JSON.stringify(item)
                            };

                            adaptedItems.push(adaptedItem);
                        });

                        result.Items = adaptedItems;

                        return result;
                    };

                    return this;
                },

                addressViewHandler: function getSecondLevelIntAddressViewHandler()
                {
                    this.handle = function(adaptedAddressCollection)
                    {
                        handleFirstLevelAddress(adaptedAddressCollection, addressBoxSize);

                        $addressContainer.find('select.first').attr('size', 1);
                    };

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
                                collection: {
                                    countryCode : countryCode,
                                    currentLevel : 'final',
                                    nextLevel : 'none',
                                    streetData: selectedAddressAtLevel['second'],
                                    buildingData: selectedAddressAtLevel['final']
                                }
                            };

                            result.resolve(apiResult);
                        });


                        return result.promise();
                    };

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
                    };

                    return this;
                },

                addressViewHandler: getFinalLevelAddressViewHandler
            }
        };

    };

    // jQuery plugin wrapper
    var pluginName = 'postcodeAnywhere';

    $.fn[pluginName] = function(options)
    {
        return this.each(function()
        {
            if ( ! $.data(this, pluginName) )
            {
                $.data(this, pluginName, new PostcodeAnywhere(this, options));
            }
        });
    };

    // AMD and CommonJS module compatibility
    if ( typeof define === 'function' && define.amd )
    {
        define(function()
        {
            return PostcodeAnywhere;
        });
    }
    else if ( typeof module !== 'undefined' && module.exports )
    {
        module.exports = PostcodeAnywhere;
    }

})(jQuery);