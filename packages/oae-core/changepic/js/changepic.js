/*!
 * Copyright 2014 Apereo Foundation (AF) Licensed under the
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

define(['jquery', 'oae.core', 'jquery.jcrop', 'jquery.fileupload', 'jquery.iframe-transport'], function($, oae) {

    return function(uid) {


        //////////////////////
        // WIDGET VARIABLES //
        //////////////////////

        // The widget container
        var $rootel = $('#' + uid);

        // Holds the context for which the profile picture should be shown and changed. e.g. group profile
        var contextData = false;

        // The cropping data used to send to the cropping service
        var cropData = {
            x: 0,
            y: 0,
            width: 0,
            principalId: null
        };

        // IE9 and below don't support XHR file uploads and we fall back to iframe transport
        var useIframeTransport = !$.support.xhrFileUpload && !$.support.xhrFormDataFileUpload;


        /////////////////////
        // VIEW MANAGEMENT //
        /////////////////////

        /**
         * Shows the previously selected profile picture or default placeholder in the dropzone
         */
        var showPlaceHolder = function() {
            // Show the picture placeholder container
            $('#changepic-pic-container', $rootel).show();

            // Render the picture placeholder
            oae.api.util.template().render($('#changepic-profile-picture-template', $rootel), {
                'pictureUrl': contextData.picture.medium
            }, $('#changepic-pic-container', $rootel));

            // Initialize the fileupload plugin
            setUpUploadPicture();
        };

        /**
         * Shows the freshly uploaded picture and applies jCrop to it to enable the user to crop a profile picture.
         *
         * @param  {User|Group}    data    The user or group profile
         */
        var showCroppingArea = function(data) {
            // Render the freshly uploaded picture
            oae.api.util.template().render($('#changepic-jcrop-template', $rootel), {
                'pictureUrl': data.picture.large
            }, $('#changepic-form #changepic-jcrop-container', $rootel));

            // Hide the upload progress
            $('#changepic-uploading-container', $rootel).hide();

            // Unlock the modal so it can be closed again
            $('#changepic-modal', $rootel).modal('unlock');

            // Initialize jCrop to allow for user selection when the image has loaded into the DOM
            $('#changepic-jcrop', $rootel).on('load', function(ev, b,c,d) {
                // If the image is smaller than 200x200 we reject it
                if (ev.currentTarget.naturalWidth < 200 || ev.currentTarget.naturalHeight < 200) {
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_IS_TOO_SMALL__', 'changepic'),
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_YOU_TRIED_TO_UPLOAD_IS_TOO_SMALL__', 'changepic'),
                        'error'
                    );
                    showPlaceHolder();
                } else {
                    // Widen the modal for the cropping phase
                    $('#changepic-modal', $rootel).removeClass('changepic-initial-view');

                    // Show the cropping area
                    $('#changepic-form #changepic-jcrop-container', $rootel).show();

                    // Show the footer
                    $('.modal-footer', $rootel).show();

                    // Set up the cropping area
                    setUpJCrop();
                }
            });
        };

        /**
         * Shows a progress indicator while the selected image is uploading.
         * If the browser does not support progress indication a regular spinner is shown.
         */
        var showUploadingPicture = function() {
            // Hide the browse view
            $('#changepic-pic-container', $rootel).hide();

            // Show the upload progress
            $('#changepic-uploading-container', $rootel).show();

            // Lock the modal so it cannot be closed during upload
            $('#changepic-modal', $rootel).modal('lock');

            // If we need an iframe for the upload, progress will probably not be supported
            if (useIframeTransport) {
                // Show the upload spinner instead of the progress bar
                $('#changepic-uploading-container .fa-spinner', $rootel).show();
            } else {
                // Show the upload progress bar
                $('#changepic-uploading-container .progress', $rootel).show();
            }
        };

        /**
         * Updates the progress indicator
         *
         * @param  {Number}   progress   Number between 0 and 100 indicating the upload progress
         */
        var updateProgress = function(progress) {
            $('.progress-bar', $rootel).css('width', progress + '%').attr('aria-valuenow', progress);
            $('.progress-bar .sr-only', $rootel).text(progress + '%');
        };


        //////////////////////
        // PICTURE HANDLING //
        //////////////////////

        /**
         * When pictures are scaled down to fit in the modal, JCrop returns coordinates based on the scaled image.
         * Recalculation of the coordinates needs to happen to apply to the original image.
         *
         * @param  {Object}   crd          Cropping coordinates received from the jCrop plugin
         * @param  {Object}   crd.x        The x coordinate of the point from where to start cropping
         * @param  {Object}   crd.y        The y coordinate of the point from where to start cropping
         * @param  {Object}   crd.width    Width of the area to be cropped
         */
        var calculateCoordinates = function(crd) {
            var naturalWidth = $('#changepic-jcrop', $rootel)[0].naturalWidth;
            var naturalHeight = $('#changepic-jcrop', $rootel)[0].naturalHeight;
            var displayWidth = $('#changepic-jcrop', $rootel).width();
            var displayHeight = $('#changepic-jcrop', $rootel).height();

            widthScale = naturalWidth / displayWidth;
            heightScale = naturalHeight / displayHeight;

            cropData.x = Math.floor(crd.x * widthScale);
            cropData.y = Math.floor(crd.y * heightScale);
            // Adjust the width by 1 to avoid possible rounding errors caused by
            // the floating point numbers used to represent the different scales.
            // @see https://github.com/oaeproject/3akai-ux/pull/3034
            cropData.width = Math.floor(crd.w * widthScale) - 1;
        };

        /**
         * Calculates the preselected area of the image the user uploaded. The returned coordinates are
         * centered horizontally and vertically in the image leaving at least 20 pixels at the edges.
         *
         * @return {String[]}    Returns an array of cropping coordinates ([x1, y1, x2, y2]).
         */
        var getDefaultCropSelection = function() {
            // Get the width and height of the image in the DOM.
            var displayWidth = $('#changepic-jcrop', $rootel).width();
            var displayHeight = $('#changepic-jcrop', $rootel).height();

            // Initialize the crop coordinates
            var x1 = 0;
            var y1 = 0;
            var x2 = 0;
            var y2 = 0;

            // Get the lesser value between the width and height to base calculations on.
            var dimension = Math.min(displayWidth, displayHeight) - 40;

            // Calculate the initial cropping coordinates
            x1 = (displayWidth / 2) - (dimension / 2);
            x2 = x1 + dimension;
            y1 = (displayHeight / 2) - (dimension / 2);
            y2 = y1 + dimension;

            return [x1, y1, x2, y2];
        };

        /**
         * Crop the profile picture. Upon completion, an `oae.changepic.update` event will be
         * sent out containing the update profile object and the modal will be closed. While the
         * data is sent to the server a spinning animation will indicate that cropping is in progress.
         */
        var setPicture = function() {
            // Hide the cropping area
            $('#changepic-form #changepic-jcrop-container', $rootel).hide();

            // Hide the footer buttons
            $('.modal-footer', $rootel).hide();

            // Show that the image is being cropped
            $('#changepic-cropping-container', $rootel).show();

            // Make sure the correct principalID is passed
            cropData.principalId = contextData.id;

            // Lock the modal so it cannot be closed during cropping
            $('#changepic-modal', $rootel).modal('lock');

            // Send the request to crop the image
            $.ajax({
                'url': '/api/crop',
                'type': 'POST',
                'data': cropData,
                'success': function(data) {
                    $(document).trigger('oae.changepic.update', data);

                    // Unlock the modal
                    $('#changepic-modal', $rootel).modal('unlock');
                    // Hide the modal
                    $('#changepic-modal', $rootel).modal('hide');
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_UPDATED__', 'changepic'),
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_SUCCESSFULLY_UPDATED__', 'changepic')
                    );
                },
                'error': function() {
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_NOT_UPDATED__', 'changepic'),
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_COULD_NOT_BE_UPDATED__', 'changepic'),
                        'error'
                    );
                    // Unlock the modal
                    $('#changepic-modal', $rootel).modal('unlock');
                    // Hide that the image is being cropped
                    $('#changepic-cropping-container', $rootel).hide();
                    // Show the cropping area
                    $('#changepic-form #changepic-jcrop-container', $rootel).show();
                    // Show the footer buttons
                    $('.modal-footer', $rootel).show();
                }
            });

            return false;
        };

        /**
         * Initializes the jCrop plugin on the full-size images that come back from the server
         * when a user uploaded a picture.
         *
         * @see http://deepliquid.com/content/Jcrop_API.html
         */
        var setUpJCrop = function() {
            $('#changepic-jcrop', $rootel).Jcrop({
                'aspectRatio': 1,
                'bgOpacity': 0.4,
                'bgColor': '#FFF',
                'touchSupport': true,
                'minSize': [50, 50],
                'setSelect': getDefaultCropSelection(),
                'onSelect': calculateCoordinates
            });

            // Focus jCrop for immediate keyboard access
            $('#changepic-modal .jcrop-keymgr').focus();
        };

        /**
         * Initializes jQuery fileupload to allow the users to upload an image by
         * browsing for it or dropping it on the drop zone.
         */
        var setUpUploadPicture = function() {
            $('.changepic-dropzone-content i.fa-' + contextData.resourceType, $rootel).removeClass('hide');

            // Destroy the previous fileupload first
            if ($('#changepic-form', $rootel).fileupload()) {
                $('#changepic-form', $rootel).fileupload('destroy');
            }

            var fileuploadOptions = {
                'url': '/api/' + contextData.resourceType + '/' + contextData.id + '/picture',
                'dropZone': $('#changepic-dropzone', $rootel),
                'forceIframeTransport': useIframeTransport,
                'progress': function(ev, data) {
                    // If we need an iframe for the upload, progress will probably not be supported
                    if (!useIframeTransport) {
                        // Update the progress bar
                        updateProgress((data.loaded / data.total) * 100);
                    }
                },
                'add': function(ev, data) {
                    // Get the extension of the selected file and match it against supported types
                    var extension = data.files[0].name.split('.').pop();
                    var validType = extension.match(/(gif|jpe?g|png)$/i);

                    // If no valid image type has been submitted, show a notification
                    if (!validType) {
                        oae.api.util.notification(
                            oae.api.i18n.translate('__MSG__INVALID_PROFILE_PICTURE__', 'changepic'),
                            oae.api.i18n.translate('__MSG__SELECT_A_VALID_PROFILE_PICTURE__', 'changepic'),
                            'error'
                        );
                    // Don't allow images over 10MB
                    } else if (data.files[0].size > 10000000) {
                        oae.api.util.notification(
                            oae.api.i18n.translate('__MSG__INVALID_PROFILE_PICTURE__', 'changepic'),
                            oae.api.i18n.translate('__MSG__PROFILE_PICTURE_YOU_TRIED_TO_UPLOAD_IS_TOO_LARGE__', 'changepic'),
                            'error'
                        );
                    // If a valid image type has been submitted do the upload
                    } else {
                        showUploadingPicture();
                        data.submit();
                    }
                },
                'error': function(ev, data) {
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_NOT_UPLOADED__', 'changepic'),
                        oae.api.i18n.translate('__MSG__PROFILE_PICTURE_UPLOAD_FAILED__', 'changepic'),
                        'error'
                    );
                    // Unlock the modal
                    $('#changepic-modal', $rootel).modal('lock');
                    reset();
                    showPlaceHolder();
                },
                'done': function(ev, data) {
                    if (useIframeTransport) {
                        showCroppingArea($.parseJSON($(data.result[0]).text()));
                    } else {
                        updateProgress(100);
                        showCroppingArea($.parseJSON(data.result));
                    }
                }
            };

            $('#changepic-form', $rootel).fileupload(fileuploadOptions);
        };


        ////////////////////
        // INITIALIZATION //
        ////////////////////

        /**
         * Reset the state of the widget when the modal dialog has been closed
         */
        var reset = function() {
            // Add the initial view class to the modal
            $('#changepic-modal', $rootel).addClass('changepic-initial-view');

            // Remove the jCrop container
            $('#changepic-form #changepic-jcrop-container', $rootel).empty();

            // Hide all views
            $('.modal-body > div', $rootel).hide();

            // Reset the progress indication
            updateProgress(0);

            // Hide the footer
            $('.modal-footer', $rootel).hide();
        };

        /**
         * Adds binding to various elements in the widget
         */
        var addBinding = function() {
            $('#changepic-form', $rootel).on('submit', setPicture);
            $('#changepic-modal', $rootel).on('hidden.bs.modal', reset);
        };

        /**
         * Initialize the change picture modal dialog
         */
        var setUpChangePicModal = function() {
            $(document).on('click', '.oae-trigger-changepic', function() {
                // Show the changepic modal
                $('#changepic-modal', $rootel).modal({
                    'backdrop': 'static'
                });

                // Request the context information
                $(document).trigger('oae.context.get', 'changepic');

                // Hide the spinner icon using jQuery
                // @see https://github.com/FortAwesome/Font-Awesome/issues/729
                $('.fa-spinner', $rootel).hide();
            });

            // Receive the content profile information and set up the fileupload plugin
            $(document).on('oae.context.send.changepic', function(ev, ctx) {
                contextData = ctx;
                showPlaceHolder();
            });
        };

        addBinding();
        setUpChangePicModal();

    };
});
