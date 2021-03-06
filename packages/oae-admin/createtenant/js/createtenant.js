/*!
 * Copyright 2015 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

define(['jquery', 'underscore', 'oae.core', 'iso3166'], function($, _, oae, iso3166) {

    return function(uid, showSettings) {

        // The widget container
        var $rootel = $('#' + uid);

        /**
         * Set up the validation on the `create tenant` form, including the error messages
         */
        var setUpValidation = function() {
            var validateOpts = {
                'rules': {
                    'host': {
                        'hostname': true
                    }
                },
                'messages': {
                    'alias': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_A_TENANT_ALIAS__', 'createtenant')
                    },
                    'displayName': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_A_TENANT_NAME__')
                    },
                    'host': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_A_HOST_NAME__'),
                        'hostname': oae.api.i18n.translate('__MSG__PLEASE_ENTER_A_VALID_HOST_NAME__')
                    },
                    'emailDomains': {
                        'emailDomains': oae.api.i18n.translate('__MSG__PLEASE_ENTER_VALID_EMAIL_DOMAINS__')
                    }
                },
                'methods': {
                    'hostname': {
                        'method': function(value) {
                            return (!value || oae.api.util.validation().isValidHost(value));
                        }
                    },
                    'emailDomains': {
                        'method': function(value) {
                            // Creating a tenant without providing an email domain is allowed
                            if (!value) {
                                return true;
                            }

                            // Each email domain expression should be a valid hostname
                            return !_.chain(value.split(','))
                                .map(function(emailDomain) { return emailDomain.trim(); })
                                .map(oae.api.util.validation().isValidHost)
                                .contains(false)
                                .value();
                        }
                    }
                },
                'submitHandler': createTenant
            };
            oae.api.util.validation().validate($('#createtenant-form', $rootel), validateOpts);
        };

        /**
         * Create a new tenant
         */
        var createTenant = function() {
            var values = $('#createtenant-form', $rootel).serializeObject(false);

            var opts = {};
            if (values.emailDomains) {
                opts.emailDomains = _.chain(values.emailDomains.split(','))
                    .map(function(emailDomain) { return emailDomain.trim(); })
                    .compact()
                    .value();
            }

            if (values.countryCode) {
                opts.countryCode = values.countryCode;
            }

            oae.api.admin.createTenant(values.alias, values.displayName, values.host, opts, function(err, tenant) {
                if (err) {
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__TENANT_NOT_CREATED__', 'createtenant'),
                        err.msg,
                        'error');
                } else {
                    $('#createtenant-modal', $rootel).modal('hide');
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__TENANT_CREATED__', 'createtenant'),
                        oae.api.i18n.translate('__MSG__TENANT_SUCCESSFULLY_CREATED__', 'createtenant', {'displayName': oae.api.util.security().encodeForHTML(tenant.displayName)}));
                    $(document).trigger('oae.createtenant.done', tenant);
                }
            });
            return false;
        };

        /**
         * Initialize the create tenant modal
         */
        var init = function() {
            $(document).on('click', '.oae-trigger-createtenant', function() {
                $('#createtenant-modal', $rootel).modal({
                    'backdrop': 'static'
                });
            });

            $('#createtenant-modal', $rootel).on('hidden.bs.modal', function() {
                // Reset the form
                $('button, input', $rootel).prop('disabled', false);
                var $form = $('#createtenant-form', $rootel);
                $form[0].reset();
                oae.api.util.validation().clear($form);
            });

            // Set focus to the tenant alias field
            $('#createtenant-modal', $rootel).on('shown.bs.modal', function () {
                $('#createtenant-alias', $rootel).focus();
                oae.api.util.template().render($('#createtenant-countrycode-template', $rootel), {
                    'countries': iso3166.countries
                }, $('#createtenant-countrycode-container', $rootel));
            });
        };

        init();
        setUpValidation();
    };
});
