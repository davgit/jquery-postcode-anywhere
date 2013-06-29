    /*
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
    */

    ////////////////////////////////////////////////////////////////////////////








            /*
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

    */











/*
    var addressFinder =
    {
        uk:
        {
            first: function()
            {
                this.findBy = function getFirstLevelUKAddressFinder(postcode)
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

            final: function getFinalLevelUKAddressFinder()
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
        },

        int:
        {
            first: function getFirstLevelIntAddressFinderFor(countryCode)
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

            second: function getSecondLevelIntAddressFinderFor(countryCode)
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

            final: function getFinalLevelIntAddressFinderFor(countryCode)
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
        }
    };

*/

        /*
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
    */

    /*
    function getSecondLevelIntAddressViewHandler()
    {
        this.handle = function(adaptedAddressCollection)
        {
            handleFirstLevelAddress(adaptedAddressCollection);
        }

        return this;
    }
    */