import Link from 'next/link'

export function CTASection() {
  return (
    <section className='py-16 sm:py-24 bg-gradient-to-r from-primary-600 to-blue-700'>
      <div className='container-safe'>
        <div className='text-center'>
          {/* Main CTA Content */}
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6'>
              Ready to Start Your
              <span className='block'>AI-Powered Fitness Journey?</span>
            </h2>
            <p className='text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto'>
              Join thousands of families and gym members who are achieving their fitness goals 
              with personalized AI coaching. Start free today.
            </p>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12'>
              <Link 
                href='/sign-up' 
                className='bg-white text-primary-600 hover:bg-gray-50 active:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 w-full sm:w-auto touch-target shadow-lg hover:shadow-xl'
              >
                Start Free Trial
              </Link>
              <Link 
                href='/contact' 
                className='bg-primary-500/20 text-white border border-white/30 hover:bg-primary-500/30 active:bg-primary-500/40 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 w-full sm:w-auto touch-target'
              >
                Contact Sales
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 text-center'>
              <div className='flex flex-col items-center'>
                <div className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  500+
                </div>
                <p className='text-blue-100 text-sm'>
                  Active Families
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  50+
                </div>
                <p className='text-blue-100 text-sm'>
                  Gym Partners
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  4.9⭐
                </div>
                <p className='text-blue-100 text-sm'>
                  User Rating
                </p>
              </div>
            </div>
          </div>

          {/* Gym Partnership CTA */}
          <div className='mt-16 pt-16 border-t border-white/20'>
            <div className='max-w-3xl mx-auto'>
              <h3 className='text-2xl sm:text-3xl font-bold text-white mb-4'>
                Are You a Gym Owner?
              </h3>
              <p className='text-lg text-blue-100 mb-8'>
                Offer AI personal training to your members with our white-label solution. 
                Increase member engagement and create new revenue streams.
              </p>
              
              <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
                <Link 
                  href='/gym-partnership' 
                  className='bg-white text-primary-600 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl transition-all duration-200 w-full sm:w-auto touch-target'
                >
                  Learn About Gym Partnerships
                </Link>
                <Link 
                  href='/demo' 
                  className='text-white hover:text-blue-100 font-medium transition-colors w-full sm:w-auto text-center'
                >
                  Schedule a Demo →
                </Link>
              </div>

              {/* Partnership Benefits */}
              <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm'>
                <div className='flex items-center justify-center sm:justify-start space-x-2'>
                  <svg className='h-5 w-5 text-green-300' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='text-blue-100'>White-label Branding</span>
                </div>
                <div className='flex items-center justify-center sm:justify-start space-x-2'>
                  <svg className='h-5 w-5 text-green-300' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='text-blue-100'>Member Analytics</span>
                </div>
                <div className='flex items-center justify-center sm:justify-start space-x-2'>
                  <svg className='h-5 w-5 text-green-300' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='text-blue-100'>Revenue Sharing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}