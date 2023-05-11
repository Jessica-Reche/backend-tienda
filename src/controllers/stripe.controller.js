const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paymentIntent = async(req, res) => {
    console.log(req.body);
    const { id, amount } = req.body;

    try {

        const payment = await stripe.paymentIntents.create({
            amount,
            currency: "EUR",
            description: "basket of products",
            payment_method: id,
            confirm: true
        });
        console.log(payment);
        res.status(200).json({ message: "Payment successful", success: true });

    } catch (error) {
        return res.json({ message: error.raw.message, success: false });
    }
};

module.exports = { paymentIntent };