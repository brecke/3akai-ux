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

define(['jquery', 'oae.core', 'moment', 'async', 'underscore', 'select2'], function($, oae, moment, async, _, select2) {

    return function(uid, showSettings, widgetData) {

        // The widget container
        var $rootel = $('#' + uid);

        // Variable that indicates where to redirect the user to after signing in
        var signInRedirectUrl = null;

        // Variable that indicates what invitation info, if any, is available (e.g., email and
        // invitation token)
        var invitationInfo = null;

        // Variable that holds the configured auth strategy information for the tenant
        var authStrategyInfo = oae.api.authentication.getStrategyInfo();

        // cached variables
        var location = $.url(encodeURI(window.location.href));
        var protocol = location.attr('protocol');
        var host = location.attr('host');
        var dotDomain = '.'.concat(host.split('.').slice(1).join('.'));

        /**
         * Finish the login process by showing the correct validation message in case of a failed
         * login attempt, or by redirecting the user in case of a successful login attempt
         *
         * @param  {Error}      err        Error object containing error code and error message
         */
        var finishLogin = function(err) {
            if (err) {
                var signInMessage = oae.api.i18n.translate('__MSG__SIGN_IN__');
                $('#signin-local-form button', $rootel).html(signInMessage);
                $('#signin-local-form *', $rootel).prop('disable', false);

                // Set a `signin-local-failed-attempt` on the fields to tell jquery.validate
                // that the field is invalid
                $('#signin-local-username', $rootel).addClass('signin-local-failed-attempt');
                $('#signin-local-form', $rootel).valid();

                // Clear the password field
                $('#signin-local-password', $rootel).val('');

                // Focus into the username field
                $('#signin-local-username', $rootel).focus();
            } else {
                // let's add this tenant to the loggedin_tenancies cookie
                var cookieName = 'loggedin_tenancies';
                var loggedInTenancies = docCookies.getItem(cookieName);
                loggedInTenancies = loggedInTenancies ? JSON.parse(loggedInTenancies) : [];
                var currentTenant = oae.data.me.tenant;
                var existingCookie = _.findWhere(loggedInTenancies, { alias: currentTenant.alias });

                // a new cookie to be stored
                var newCookie = (function() {
                    return {
                        'alias': currentTenant.alias,
                        'displayName': currentTenant.displayName,
                        'lastLogin': Date.now()
                    };
                })();

                // Update the cookie list with a new one
                if (existingCookie) {
                    loggedInTenancies = _.reject(loggedInTenancies, function(eachTenancy) {
                        return eachTenancy.alias === currentTenant.alias;
                    });
                }
                loggedInTenancies.push(newCookie);

                // set cookie with updated data
                docCookies.setItem(cookieName, JSON.stringify(loggedInTenancies), null, null, dotDomain);

                // If the redirect URL is the same as the current URL, we refresh the page
                if (signInRedirectUrl === window.location.pathname) {
                    window.location.reload(true);
                } else {
                    window.location = signInRedirectUrl;
                }
            }
        };

        /**
         * Attempt to log the user in with the provided username and password onto the current
         * tenant using either the LDAP login strategy or the local login strategy. If only one of
         * them is enabled, only that strategy will be attempted. If both of them are enabled, an
         * LDAP login will be attempted first. If that is unsuccessful, a local login will be
         * attempted next. This function will only be executed when form validation has passed.
         */
        var doLocalSignIn = function() {
            // Hide the login button and show a logging in message
            var signingInMessage = oae.api.i18n.translate('__MSG__SIGNING_IN__');
            $('#signin-local-form button', $rootel).html(signingInMessage);
            $('#signin-local-form *', $rootel).prop('disable', 'true');

            // Get the entered username and password
            var username = $.trim($('#signin-local-username', $rootel).val());
            var password = $.trim($('#signin-local-password', $rootel).val());

            var ldapEnabled = authStrategyInfo[oae.api.authentication.STRATEGY_LDAP];
            var localEnabled = authStrategyInfo[oae.api.authentication.STRATEGY_LOCAL];

            // Both LDAP and local are enabled. We try LDAP first, and try local next if LDAP has failed
            if (ldapEnabled && localEnabled) {
                oae.api.authentication.LDAPLogin(username, password, function(err) {
                    if (err) {
                        oae.api.authentication.localLogin(username, password, finishLogin);
                    } else {
                        finishLogin();
                    }
                });
            // Only LDAP is enabled
            } else if (ldapEnabled) {
                oae.api.authentication.LDAPLogin(username, password, finishLogin);
            // Only local authentication is enabled
            } else {
                oae.api.authentication.localLogin(username, password, finishLogin);
            }
        };

        /**
         * Bind the validation logic to the local sign in form
         */
        var initLocalSignInFormValidation = function() {
            var validateOpts = {
                'messages': {
                    'username': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_YOUR_USERNAME__'),
                        'signin-local-failed-attempt': oae.api.i18n.translate('__MSG__INVALID_USERNAME_OR_PASSWORD__')
                    },
                    'password': oae.api.i18n.translate('__MSG__PLEASE_ENTER_YOUR_PASSWORD__')
                },
                'methods': {
                    'signin-local-failed-attempt': {
                        'method': function(value, element) {
                            // This class will be added after a failed login attempt and is used
                            // to tell jquery.validate to mark the field as invalid
                            return false;
                        }
                    }
                },
                'submitHandler': doLocalSignIn
            };

            oae.api.util.validation().validate($('#signin-local-form', $rootel), validateOpts);

            // When the username or password fields change, remove any custom validation failure
            // message
            $('#signin-local-form input', $rootel).change(function() {
                $('#signin-local-username', $rootel).removeClass('signin-local-failed-attempt');
            });
        };

        /**
         * Fetches the public tenant logo through ajax
         */
        var _getTenantLogo = function (tenantAlias, callback) {
            $.ajax({
                'url': protocol + '://' + tenantAlias + dotDomain + '/api/ui/logo',
                'success': function (data) {
                    callback(null, data);
                },
                'error': function (jqXHR, textStatus) {
                    callback({ 'code': jqXHR.status, 'msg': jqXHR.responseText });
                }
            });
        };

        /**
         * Render the sign in options (external auth options, username & password form, etc...)
         * form
         */
        var renderSignInOptions = function() {

            /**
             * Steps
             * 1 Fetch which other tenants the user is logged in to through a cookie
             * 2 Fetch other tenants logos from the server
             * 3 Present a modal box with options to fetch the same URL through a different tenant
             */

            var allCookies = document.cookie;
            var currentTenant = oae.data.me.tenant;
            var cookieName = 'loggedin_tenancies';
            var accessDeniedToContent = location.attr('relative').indexOf('accessdenied') !== -1;
            var now = new Date();

            // Get the logged in tenancies information from cookie and create a list
            var loggedInTenancies = docCookies.getItem(cookieName);
            loggedInTenancies = loggedInTenancies ? JSON.parse(loggedInTenancies) : [];

            // Remove own tenant from tenant list
            loggedInTenancies = _.reject(loggedInTenancies, function(eachTenancy) {
                return eachTenancy.alias === currentTenant.alias;
            });

            if (loggedInTenancies && loggedInTenancies.length > 0) {
                if (accessDeniedToContent) {

                    // fetch the tenancy logo for each of the above
                    async.map(loggedInTenancies, function(eachTenancy, callback) {
                        _getTenantLogo(eachTenancy.alias, function(err, logo) {
                            eachTenancy.lastLoginFromNow = moment(parseInt(eachTenancy.lastLogin)).from(now);
                            eachTenancy.logo = logo;
                            return callback(null, eachTenancy);
                        });
                    }, function(err, loggedInTenancies) {
                        var $rootElement;
                        $rootElement = $('body');
                        oae.api.util.template().render($('#login-to-other-tenancies-template', $rootElement), {
                            'loggedInTenancies': loggedInTenancies,
                            'currentTenant': currentTenant
                        }, $('#login-to-other-tenancies-container', $rootElement));

                        // set up the triggers to link to other tenancies
                        _.each(loggedInTenancies, function(eachTenancy) {
                            // show the clickable mouse icon
                            $('#login-option-' + eachTenancy.alias).css({ cursor: 'pointer' });

                            // Pass on the click of the error-signin button to the topnav sign in action
                            $(document).on('click', '#login-option-' + eachTenancy.alias, function() {
                                oae.api.util.redirect().logInThroughAnotherTenant(eachTenancy);
                            });

                        });
                    });
                } else {
                    $rootElement = $('body');
                    oae.api.util.template().render($('#select-other-tenancy-template', $rootElement), {}, $('#login-to-other-tenancies-container', $rootElement));
                }
            }

            // Render the DOM elements
            var externalAuthOpts = {
                'data': {
                    'redirectUrl': signInRedirectUrl,
                    'invitationToken': invitationInfo.token
                }
            };
            oae.api.util.template().render($('#signin-options-template', $rootel), {
                'authStrategyInfo': authStrategyInfo,
                'externalAuthOpts': externalAuthOpts
            }, $('#signin-options-container', $rootel));

            // Handle username / password authentication
            initLocalSignInFormValidation();
        };

        /**
         * Render the footer for the signin modal
         */
        var renderSignInFooter = function() {
            oae.api.util.template().render($('#signin-modal-footer-template', $rootel), {
                'authStrategyInfo': authStrategyInfo
            }, $('#signin-modal-footer-container', $rootel));
        };

        /**
         * Initialize the signin modal
         */
        var init = function() {
            $(document).on('click', '.oae-trigger-signin', function() {
                // Get the sign in options from the trigger element
                var signInData = $(this).data();
                signInRedirectUrl = signInData.redirecturl;
                invitationInfo = {
                    'email': signInData.email,
                    'token': signInData.token
                };

                // Auto-signin if there is only one external signin method available
                if (authStrategyInfo.hasSingleExternalAuth) {
                    oae.api.authentication.externalLogin(_.keys(authStrategyInfo.enabledExternalStrategies)[0], {
                        'redirectUrl': signInRedirectUrl,
                        'invitationToken': invitationInfo.token
                    });
                    return;
                }

                // Show the register form and hide the Terms and Conditions
                renderSignInOptions();
                renderSignInFooter();

                // change the modal title
                var existingTitle = $('#signin-modal-title').text();
                $('#signin-modal-title').text(existingTitle + oae.data.me.tenant.displayName);

                // Trigger the modal dialog
                $('#signin-modal', $rootel).modal({
                    'backdrop': 'static'
                });

                // When the modal has displayed, highlight the username field if it is available
                $('#signin-modal', $rootel).on('shown.bs.modal', function() {
                    $('#signin-local-username', $rootel).focus();

                    // let's initialize the select2 tenancy picker
                    var searchTenancyModule = require('oae.api.tenancysearch')();
                });

            });
        };

        init();
    };
});
