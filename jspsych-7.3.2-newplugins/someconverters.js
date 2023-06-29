function convertCommonCode( ccX, ccY, stimulusHeightInPixels, desiredDegreeOfVisualAngle, debug ){
    // Convert pixels to cm knowing that a credit card is 5.40 cm x 8.56 cm
    // Returns both vertical and horizontal distances (even though they should be equal)
    if (!(debug === undefined)) {console.log("CONVERTER:: size of card in pixels:", ccX, ccY  );}
    var pixelsXPerCM = ccX / 8.56;
    var pixelsYPerCM = ccY / 5.40;
    if (!(debug === undefined)) {console.log("CONVERTER:: Pixels per cm:", pixelsXPerCM, pixelsYPerCM );}
    //convert angle of vision to distance
    var distanceInPixels = (stimulusHeightInPixels/2)/Math.tan(desiredDegreeOfVisualAngle*(Math.PI/180)/2);
    if (!(debug === undefined)) {console.log("CONVERTER:: Distance from screen in px", distanceInPixels);}
    var distanceXInCM = distanceInPixels / pixelsXPerCM; 
    var distanceYInCM = distanceInPixels / pixelsYPerCM; 
    return [distanceXInCM, distanceYInCM];
}
function convertCreditCardDimensionsToDistanceInCM( ccX, ccY, stimulusHeightInPixels, desiredDegreeOfVisualAngle, debug ) {
    // Returns the distance to screen in cm to have a stimulus have a certain degree of visual angle
    // Parameters are:
    //   ccX, ccY                   : the credit card dimensions, in pixels
    //   stimulusHeightInPixels     : size of the stimulus in pixels
    //   desiredDegreeOfVisualAngle : stimulus desired size in degrees
    distances = convertCommonCode( ccX, ccY, stimulusHeightInPixels, desiredDegreeOfVisualAngle );
    var distanceInCM = Math.round( (distances[0] + distances[0])/2 ); // average X and Y distances for better estimate
    if (!(debug === undefined)) {console.log("CONVERTER:: Distance from screen in cm", distanceInCM );}

    return distanceInCM;
}

function convertCreditCardDimensionsToDistanceInIN( ccX, ccY, stimulusHeightInPixels, desiredDegreeOfVisualAngle, debug ) {
    // Returns the distance to screen in inches to have a stimulus have a certain degree of visual angle
    // Parameters are:
    //   ccX, ccY                   : the credit card dimensions, in pixels
    //   stimulusHeightInPixels     : size of the stimulus in pixels
    //   desiredDegreeOfVisualAngle : stimulus desired size in degrees
    distances = convertCommonCode( ccX, ccY, stimulusHeightInPixels, desiredDegreeOfVisualAngle );
    var distanceInIN = Math.round( (distances[0] + distances[0])/2/2.54 );
    if (!(debug === undefined)) { console.log("CONVERTER:: Distance from screen in inches", distanceInIN );}

    return distanceInIN;
}